# Markdown 渲染迁移至 `react-markdown` 评估与实施计划

> 状态：待评估，本文档不代表已经批准实施  
> 适用阶段：Stage 5.2 / 5.2.1 安全与工程可靠性治理  
> 编写日期：2026-09-10  
> 关联问题：`src/components/PostClient.tsx` 中 `marked.parse()` + `dangerouslySetInnerHTML` 的 Markdown XSS 风险

---

## 一、背景与目标

当前文章详情页在客户端使用 `marked` 将文章正文转换为 HTML，再通过 React 的 `dangerouslySetInnerHTML` 注入页面：

```text
post.content
  -> marked.parse()
  -> HTML string
  -> dangerouslySetInnerHTML
  -> 浏览器 DOM
```

该链路虽然目前主要接收本地 Markdown 和管理员同步内容，但仍然具有以下风险：

1. 原始 HTML、事件属性或危险 URL 可能进入最终 DOM。
2. `dangerouslySetInnerHTML` 使渲染安全性依赖于每一个解析和净化环节都配置正确。
3. 将来如果开放外部导入、用户投稿或协作编辑，当前链路会形成存储型 XSS 边界。
4. 当前 Biome 必须通过忽略注释放行 `dangerouslySetInnerHTML`，不利于后续安全审计。

本计划拟评估将渲染链路迁移为 React 节点渲染：

```text
post.content
  -> react-markdown
  -> mdast/hast 转换
  -> React elements
  -> 页面 DOM
```

### 目标

- 移除文章正文渲染处的 `dangerouslySetInnerHTML`。
- 保留当前文章所使用的 CommonMark / GFM 能力、代码块、表格、删除线、任务列表、图片和链接。
- 默认不执行 Markdown 中的原始 HTML。
- 明确链接、图片和自定义渲染组件的安全边界。
- 保持现有 `prose-blog` 样式、阅读时长、目录导航、滚动高亮和文章元数据功能。
- 建立渲染回归测试和 XSS 负面测试，为后续 CI 门禁提供基础。

### 非目标

- 本次迁移不改变数据库中的 `Post.content` 存储格式。
- 不迁移 Markdown 内容、不修改 Frontmatter 和同步脚本。
- 不处理动态主题 CSS 的注入问题；该问题仍属于 `src/lib/theme.ts` 与 `src/app/layout.tsx` 的独立安全任务。
- 不为了兼容少量特殊 HTML 而默认开启 `rehype-raw`。

---

## 二、当前实现基线

### 影响文件

| 文件 | 当前职责 | 迁移影响 |
| :--- | :--- | :--- |
| `src/components/PostClient.tsx` | 解析 Markdown、注入 HTML、提取标题目录 | 核心改造文件 |
| `src/app/globals.css` | 提供 `prose` / `prose-blog` 排版样式 | 原则上无需改动，需做视觉回归 |
| `src/types/*` | 提供 `PostWithTags` 等文章类型 | 无预期改动 |
| `scripts/check-content.ts` | 校验本地 Markdown 和 Frontmatter | 无预期改动，可补充不允许 HTML 的内容规范 |
| `content/posts/*` | 文章正文 | 需要先盘点原始 HTML 和特殊语法 |
| `package.json` / `bun.lock` | 依赖清单 | 增加 Markdown 渲染相关依赖，移除 `marked` |

### 当前行为需要保留

- `gfm: true`。
- `breaks: true` 对单换行的处理效果，需确认 `react-markdown` 的换行配置是否满足现有内容。
- 标题、段落、列表、引用、链接、图片、代码块和内联代码。
- GFM 表格、删除线、任务列表。
- 文章内容容器的 `prose prose-lg prose-blog max-w-none dark:prose-invert` class。
- 通过 `articleContentRef` 查询标题并生成目录、滚动定位和当前项高亮。
- Markdown 解析失败时的可控降级行为和统一日志策略。

---

## 三、推荐技术方案

### 3.1 首选依赖组合

建议使用：

```text
react-markdown
remark-gfm
```

可根据最终安全评估增加：

```text
rehype-sanitize
```

建议移除：

```text
marked
```

说明：`react-markdown` 默认将 Markdown 语法转换为 React 元素，不需要通过 `dangerouslySetInnerHTML` 注入 HTML。`remark-gfm` 用于补齐 GitHub Flavored Markdown。`rehype-sanitize` 是可选的纵深防御层，尤其适合未来增加 rehype 插件、允许受控 HTML 或接入不完全由项目控制的 Markdown 内容时使用。

### 3.2 安全默认值

迁移后的第一版应遵循以下规则：

1. **不使用 `rehype-raw`**。不把 Markdown 中的 `<script>`、`<iframe>`、内联 HTML 等重新解析为 DOM 节点。
2. 不自定义允许执行 HTML 的 rehype 插件。
3. 不覆盖默认的安全 URL 转换逻辑为“全部允许”。
4. 对 `a` 和 `img` 使用自定义组件时，只做属性增强，不直接拼接 HTML。
5. 外链统一设置合理的 `rel` 属性；是否统一 `target="_blank"` 需要产品确认，不能仅为了安全盲目添加。
6. 如果启用 `rehype-sanitize`，使用明确的最小 schema，而不是无差别放开所有标签、属性和协议。
7. Markdown 正文不允许通过组件映射渲染任意用户可控 React 组件。

### 3.3 原始 HTML 的处理策略

`react-markdown` 默认不会把 Markdown 中的原始 HTML 当作可执行 HTML 渲染。对于当前内容中可能存在的 HTML，需要在实施前完成盘点：

| 内容类型 | 建议处理 |
| :--- | :--- |
| 普通 Markdown 对应语法 | 直接保留，交由 `react-markdown` 渲染 |
| `<br>`、简单 `<span>` 等排版 HTML | 优先改写为 Markdown 或组件支持的语法 |
| `<details>` / `<summary>` | 评估是否用安全的自定义 Markdown 语法或独立 React 组件替代 |
| `<iframe>`、`<script>`、事件属性 | 默认删除或以纯文本显示，不兼容 |
| Mermaid / 第三方嵌入 HTML | 单独设计白名单和来源策略，不在第一阶段放开 |
| 仅用于历史文章的特殊 HTML | 先建立快照和迁移清单，再逐篇处理 |

只有在明确确认业务必须支持受控 HTML 时，才评估 `rehype-raw`。即使启用，也必须配合 `rehype-sanitize`、严格 schema、协议白名单和专门的安全测试；不能把 `rehype-raw` 作为默认兼容开关。

### 3.4 自定义组件边界

建议只对以下节点进行组件映射：

- `a`：统一外链属性、保留可访问性属性，并校验 `href`。
- `img`：保留 alt/title，按现有媒体策略决定使用原生 `img` 还是 `next/image`；不要在第一版为了接入 `next/image` 引入过大的 URL 配置变更。
- `pre` / `code`：保留现有代码块样式；如将来加入语法高亮，必须单独评估插件输入安全。
- `h1` ~ `h4`：如有必要生成稳定 ID，但应避免直接把未处理正文作为 HTML 属性拼接。

如果目录仍然通过 `articleContentRef.current.querySelectorAll('h1, h2, h3, h4')` 工作，可以先保持 DOM 查询方案，降低迁移范围。后续如需减少客户端副作用，再考虑从 Markdown AST 预先提取目录。

---

## 四、分阶段实施路线

### 阶段 0：内容与行为盘点（实施前）

1. 扫描 `content/posts/**/*.md`，统计：
   - 原始 HTML 标签。
   - 表格、任务列表、删除线、单换行、代码块和嵌套列表。
   - 相对图片、绝对图片、`javascript:` / `data:` / `mailto:` 等协议 URL。
   - 标题重复、中文标题、特殊字符标题和空标题。
2. 保存当前 `marked` 输出或页面截图作为迁移前快照。
3. 明确是否存在必须支持的 HTML 扩展；若没有，锁定“不启用 `rehype-raw`”方案。
4. 记录当前 `marked` 的 `breaks: true` 行为，准备等价回归样例。

### 阶段 1：建立独立渲染边界

建议将 Markdown 渲染逻辑从 `PostClient.tsx` 拆出为纯职责组件，例如：

```text
src/components/MarkdownContent.tsx
```

该组件负责：

- 接收 `content: string`。
- 固定 `remarkPlugins` 和安全 URL 策略。
- 固定自定义组件映射。
- 输出 React 节点，不输出 HTML 字符串。
- 不负责文章查询、评论、阅读进度或目录状态。

`PostClient` 只保留文章页面状态和 `MarkdownContent` 的容器 ref。这样可以将安全审计和单元测试集中在一个边界内。

### 阶段 2：替换解析与渲染

1. 安装并锁定 `react-markdown`、`remark-gfm` 的版本。
2. 使用 `remarkPlugins={[remarkGfm]}` 替换 `marked.setOptions({ gfm: true })`。
3. 以 `<Markdown>{post.content}</Markdown>` 替换 HTML 字符串和 `dangerouslySetInnerHTML`。
4. 对链接、图片、代码块和标题补充最小化组件映射。
5. 移除 `marked` import、全局配置、HTML 字符串状态和对应 Biome ignore 注释。
6. 若采用 `rehype-sanitize`，先以默认 schema 验证，再基于确有需要的合法 Markdown 语法扩展 schema。

### 阶段 3：目录与交互回归

1. 确认 React 节点渲染完成后，现有 `articleContentRef` 能够查询到标题。
2. 重新验证标题 ID 生成是否稳定、重复标题是否冲突。
3. 验证移动端目录、桌面端目录、滚动高亮和点击定位。
4. 确认文章切换时旧目录不会残留。
5. 确认空正文、解析异常和加载状态仍然有合理表现。

### 阶段 4：安全测试与内容修复

1. 加入恶意输入测试，确认脚本、事件属性、危险 URL 不会进入可执行 DOM。
2. 对阶段 0 发现的兼容内容逐篇改写或明确标记不支持。
3. 评估是否将“文章不得依赖原始 HTML”加入内容校验和贡献指南。
4. 在测试环境检查 CSP、生产构建和浏览器控制台无异常。

### 阶段 5：清理与发布

1. 确认全仓库不再有正文渲染相关的 `dangerouslySetInnerHTML` 或 `marked` 引用。
2. 删除 `marked` 依赖并更新 `bun.lock`。
3. 更新 Stage 5.2.1 文档，将“引入 DOMPurify”调整为“采用 React 节点渲染，并按需要使用 rehype-sanitize”。
4. 更新 README 或内容编写说明，明确支持的 Markdown 子集。
5. 按项目验证清单执行 lint、类型检查、内容检查和生产构建。

---

## 五、测试计划

当前项目尚未建立独立测试脚本，因此实施时建议同步引入 Vitest，或先建立可被未来测试框架复用的纯函数边界。

### 5.1 功能测试矩阵

| 类别 | 用例 |
| :--- | :--- |
| 基础语法 | 标题、段落、粗体、斜体、引用、水平线、嵌套列表 |
| GFM | 表格、任务列表、删除线、自动链接 |
| 换行 | 单换行、段落换行、代码块中的换行 |
| 代码 | 围栏代码块、语言标记、内联代码、特殊字符转义 |
| 媒体 | 相对图片、绝对图片、缺失 alt、普通链接、锚点链接 |
| 中文内容 | 中文标题 ID、中文标点、重复标题、混合中英文标题 |
| 页面交互 | TOC、滚动高亮、点击定位、文章切换、移动端目录 |
| 异常 | 空内容、超长内容、畸形 Markdown、渲染异常降级 |

### 5.2 XSS 负面用例

以下输入不应产生可执行脚本或危险 DOM：

```markdown
<script>alert(1)</script>
<img src=x onerror=alert(1)>
[danger](javascript:alert(1))
![danger](javascript:alert(1))
<a href="javascript:alert(1)">click</a>
<iframe src="https://attacker.example"></iframe>
```

验收时应检查实际渲染 DOM，而不是只检查字符串中是否出现某个单词。重点验证：

- 不存在可执行的 `script` 节点。
- 不存在 `onerror`、`onclick` 等事件属性。
- `href` / `src` 不接受危险协议。
- 默认不渲染原始 HTML 标签。
- 自定义组件不会把不可信属性重新拼接为 HTML。

### 5.3 视觉与构建回归

- 选取至少 3 篇包含代码块、图片、中文标题和列表的真实文章进行截图对比。
- 对比正文宽度、字体、间距、表格、代码块、图片和深色模式。
- 执行 `bun run lint`、`bunx tsc --noEmit --pretty false`、`bun run content:check -- --no-examples`、`bun run build`。
- 在开发服务器中检查浏览器控制台和网络请求，确认没有因图片或链接组件产生异常。

---

## 六、风险、取舍与回滚方案

### 主要风险

1. **Markdown 兼容性差异**：`marked` 与 unified 生态对边界语法、换行和 HTML 的处理可能不同。
2. **原始 HTML 被隐藏**：历史文章若依赖 `<details>`、嵌入内容或特殊排版，迁移后可能显示异常。
3. **目录行为变化**：React 节点渲染时机可能影响初次 `useEffect` 查询标题。
4. **图片处理差异**：直接使用 Markdown 图片可能与当前站点的 CDN、相对路径或 `next/image` 策略不完全一致。
5. **安全配置误用**：错误启用 `rehype-raw`、放宽 URL transform 或自定义组件属性，仍可能重新引入 XSS。
6. **客户端包体积变化**：需要通过构建产物和页面体验确认 unified 相关依赖的成本。

### 回滚策略

- 在单独提交中完成依赖和组件迁移，保留迁移前 commit 作为直接回滚点。
- 不修改数据库和原始 Markdown，因此回滚不需要数据迁移。
- 若少数文章存在兼容问题，优先修复文章内容或临时回退渲染组件，不重新开放全局 `dangerouslySetInnerHTML`。
- 不建议采用“检测到特殊 HTML 就对该篇文章切回 `marked`”的长期方案，否则会保留原有 XSS 边界；若必须临时兼容，应对回退链路增加明确净化，并设置删除期限。

---

## 七、验收标准

迁移可以进入发布评审的最低条件：

- [ ] `PostClient` 不再通过 `dangerouslySetInnerHTML` 渲染 Markdown。
- [ ] `marked` 已从文章渲染链路和依赖中移除。
- [ ] `react-markdown` 与 `remark-gfm` 已锁定版本并通过构建。
- [ ] 第一版未启用 `rehype-raw`，或若确需启用，已有书面白名单、`rehype-sanitize` 配置和安全测试依据。
- [ ] GFM、代码块、图片、链接、中文标题和现有目录功能回归通过。
- [ ] XSS 负面用例通过，危险协议和事件属性不会进入可执行 DOM。
- [ ] 真实文章视觉回归无阻断性问题。
- [ ] `bun run lint` 通过，且不再需要正文渲染相关的 Biome 安全忽略注释。
- [ ] `bunx tsc --noEmit --pretty false`、`bun run content:check -- --no-examples`、`bun run build` 通过。
- [ ] README、Stage 5.2.1 计划和内容编写规范已同步。

---

## 八、待评估决策

实施前需要确认以下事项：

1. 是否接受历史文章中的原始 HTML 默认不再渲染？
2. 是否需要支持 `<details>`、Mermaid、视频或第三方 iframe 等扩展？如果需要，逐项定义白名单，不以统一启用 `rehype-raw` 替代设计。
3. 图片是否继续使用原生 Markdown 图片，还是统一映射到站点现有图片组件/CDN 策略？
4. 是否在本次迁移中同步引入 `rehype-sanitize` 作为纵深防御？建议答案为“是”，但先以最小 schema 验证兼容性。
5. 是否将 Markdown 渲染组件抽离为独立文件并建立 Vitest 测试？建议答案为“是”。
6. 是否将“不得依赖原始 HTML”写入内容作者规范和 `content:check`？建议答案为“是”。

## 九、结论

迁移到 `react-markdown` 是比“继续使用 `marked` 并在结果 HTML 上追加净化”更清晰的安全边界方案：它可以从架构上移除文章正文渲染处的 `dangerouslySetInnerHTML`，并通过 React 组件映射获得更明确的标签和属性控制。

但它不是无需配置的绝对安全保证。`rehype` / `remark` 插件、URL 转换、自定义组件以及未来对原始 HTML 的支持仍然会改变安全边界。因此推荐采用以下最终方向：

```text
react-markdown
  + remark-gfm
  + （可选但推荐）rehype-sanitize
  - 不启用 rehype-raw
  - 不使用 dangerouslySetInnerHTML 渲染文章正文
  - 对链接、图片、标题和代码块使用受控组件映射
```

待完成内容盘点、兼容性样例和产品决策后，再进入实际依赖迁移阶段。

### 参考资料

- `documents/development-plan-stage5.2.1.md`
- `src/components/PostClient.tsx`
- `AGENTS.md`
- `react-markdown` 官方文档：<https://github.com/remarkjs/react-markdown>
- `remark-gfm`：<https://github.com/remarkjs/remark-gfm>
- `rehype-sanitize`：<https://github.com/rehypejs/rehype-sanitize>