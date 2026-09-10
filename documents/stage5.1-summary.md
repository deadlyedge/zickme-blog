# Stage 5.1 阶段交付总结

> 阶段名称：账户隐私、稳定头像与评论体验优化
> 完成日期：2026-09-10
> 对应计划：`documents/development-plan-stage5.1.md`

---

## 一、阶段结论

Stage 5.1 已完成账户隐私、头像稳定性、评论展示、Dashboard 导航和文章标签过滤器优化。本阶段没有新增数据库字段，也没有引入新的第三方服务。

---

## 二、主要交付内容

### 1. 评论作者隐私保护

- 评论公开响应不再返回 `author.email`；
- 评论作者使用 `displayName`；
- 用户名为空时使用邮箱 `@` 前的部分作为显示名；
- 公开评论类型与内部用户数据分离；
- 评论项增加头像和头像 fallback。

核心文件：

- `src/lib/actions/comments.ts`
- `src/lib/public-user.ts`
- `src/types/public-user.ts`
- `src/types/index.ts`
- `src/components/comments/CommentItem.tsx`

### 2. 头像生成稳定化

- 登录时不再自动同步或覆盖头像；
- 注册成功后初始化一次默认 Dicebear 头像；
- 初始化操作仅在 `user.image` 为空时执行；
- 默认 Dicebear 使用用户 ID 作为稳定 seed；
- 用户主动切换 Dicebear 时才生成新头像。

### 3. Gravatar 逻辑调整

- Gravatar 头像地址改为根据邮箱 SHA-256 生成固定 URL；
- 普通头像切换不再依赖 Gravatar Profile API 或 `GRAVATAR_API_KEY`；
- 用户中心增加 Gravatar 管理链接和隐私说明。

### 4. 禁用自定义外链头像

- 删除用户中心的自定义头像 URL 输入框；
- Server Action 对旧客户端提交的 `custom` 类型请求明确拒绝；
- 不再接受任意第三方头像地址。

### 5. 评论区和 Dashboard 体验

- 评论区当前用户头像和名称改为链接到 `/user`；
- 密码修改继续集中在用户中心，不再从评论区直接打开 Profile Modal；
- Dashboard 顶部新增“返回博客”入口。

### 6. 文章标签过滤器简化

- 移除左侧“全部”按钮；
- 移除 Popover 中的“全部文章”选项；
- 无 `tag` 参数表示全部文章；
- 当前标签通过关闭按钮清除。

---

## 三、数据库与迁移

本阶段未修改数据库 Schema，不需要新增迁移文件。继续复用现有 `user.image` 字段保存当前头像地址。

---

## 四、质量验证

已通过：

```bash
bunx biome check <Stage 5.1 修改文件>
bun run lint
bunx tsc --noEmit --pretty false
bun run content:check -- --no-examples
bun run build
bun run db:migrate
git diff --check
```

内容检查仅保留原有 `excerpt` 建议，不属于错误。

---

## 五、已知边界

1. 评论区暂未加入低透明度的大头像背景装饰，以优先保证文字可读性和编辑状态稳定；
2. 现有数据库中历史自定义外链头像未自动批量清理，后续可通过 dry-run 清理脚本处理；
3. `AuthModal` 内部仍保留 Profile 视图，评论区已不再调用，后续可在确认无其他入口后移除；
4. Gravatar 仍属于用户主动选择的第三方头像来源，默认头像使用站内生成的 Dicebear 数据 URI。

---

## 六、Stage 6 衔接

Stage 6 继续按照独立 Gallery 内容体系推进，不受本阶段用户和评论体验修改影响。