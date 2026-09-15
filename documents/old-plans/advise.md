你的犹豫是合理的。结合目前项目状态，我也倾向于认为：

> **当前的 Post/Gallery/数据库/Cloudinary/Dashboard/Git 双向同步体系，已经超过了个人博客真正需要的复杂度。**

这不是实现能力不足，而是架构目标发生了偏移：系统开始围绕“同步系统本身”建设，而不是围绕“轻松发布内容”建设。

## 我的建议：回到单向 Git-first 架构

保留：

```text
Markdown / album.yaml / WebP
        ↓
校验与构建
        ↓
数据库运行时副本
        ↓
Blog / Gallery
```

Cloudinary 只作为媒体存储和 CDN，不参与内容决策。

删除或弱化：

```text
数据库 → 本地内容源
Dashboard → 本地 Markdown 回写
数据库与 Git 双向 merge
实体级 conflict / mergeBase / revision
复杂 SyncRun / scope / retry / TTL
数据库快照作为内容恢复机制
```

更简单地说：

- **Git 是唯一内容源**
- **PostgreSQL 是部署后的查询缓存/运行时副本**
- **Cloudinary 是媒体 CDN**
- **Dashboard 只管理运行时数据和运维，不编辑内容源**
- **恢复内容靠 Git 回滚**
- **恢复数据库靠数据库备份，而不是业务快照**

---

# 适合个人项目的目标模型

## 文章

```text
content/posts/**/*.md
        ↓
content:check
        ↓
sync posts
        ↓
PostgreSQL
```

文章编辑方式只有一种：

```text
编辑 Markdown → git commit → 发布
```

Dashboard 可以保留：

- 查看文章；
- 预览文章；
- 发布/草稿状态查看；
- 查看最近发布记录；
- 手动触发发布。

但不建议继续支持：

- Dashboard 修改文章正文；
- Dashboard 回写 frontmatter；
- 数据库导出回本地；
- 数据库与 Markdown 冲突合并。

## Gallery

```text
原始图片
        ↓
本地转换为 WebP
        ↓
content/photo-gallery/{album}/
        ↓
album.yaml
        ↓
sync galleries
        ↓
Cloudinary + PostgreSQL
```

Gallery 的人工编辑源只有：

```text
album.yaml + images/*.webp
```

Dashboard 可以管理：

- 查看相册；
- 修改发布状态；
- 查看同步结果；
- 标记 Cloudinary 媒体待清理。

不需要支持完整的数据库反向编辑和 merge。

---

# 可以直接删除或降级的复杂度

## 1. 删除双向同步

目前的：

```text
sync:pull
gallery:pull
数据库文章导出
Dashboard 本地回写
```

对于个人项目的收益有限，但维护成本很高。

尤其是“双向同步”天然会带来：

- 谁是最终真相；
- 数据库和文件同时修改；
- merge base；
- 冲突；
- revision；
- 覆盖保护；
- 回写失败；
- 同步方向判断。

如果你平时主要通过 Git 管理内容，那么这些能力都可以取消。

---

## 2. 把 Sync Orchestrator 降级成简单发布脚本

不一定马上删除 `SyncRun`，但可以把它简化成：

```ts
publishContent({
  scope: 'all'
})
```

内部流程：

```text
校验内容
→ 处理媒体
→ 写入数据库
→ 输出结果
```

不再需要：

- Post/Gallery 复杂 scope 锁；
- 实体级 retry；
- conflict 状态；
- mergeBase；
- 多套兼容 Action；
- 复杂运行历史。

可以保留一个很简单的发布记录：

```text
publish_runs
- id
- startedAt
- finishedAt
- status
- postCount
- galleryCount
- errorMessage
```

个人项目通常不需要把每次同步设计成任务平台。

---

## 3. 用数据库迁移和 Git 取代 SiteSnapshot

目前 SiteSnapshot 解决的是：

```text
数据库业务副本恢复
```

但它不能恢复：

- Markdown；
- album.yaml；
- WebP；
- Cloudinary；
- 代码；
- Git 历史。

所以它容易产生一种“系统已经完整可恢复”的错觉。

更简单的方式是：

```text
内容恢复：Git revert / git checkout
数据库恢复：Neon backup / pg_dump
媒体恢复：Cloudinary 保留策略或原始图片备份
```

如果确实需要数据库保护，可以保留一个很小的：

```bash
db:backup
db:restore
```

而不是把业务表序列化到 `SiteSnapshot` 中，再自行实现恢复逻辑。

---

# 我建议保留的功能

并不是要回到一个非常简陋的系统。以下功能值得保留：

## 内容安全和校验

保留：

```bash
bun run content:check
bun run content:verify
```

这些对 Markdown 和 Gallery 都有价值。

## 图片处理

保留：

- Sharp；
- WebP 转换；
- 尺寸限制；
- EXIF 白名单；
- Cloudinary 上传；
- 原始图片目录保护。

## 单向幂等发布

保留：

```bash
bun run publish
bun run publish --scope posts
bun run publish --scope galleries
bun run publish --dry-run
```

但 `dry-run` 必须真正只读。

## Dashboard

保留为：

- 站点状态；
- 内容预览；
- 发布按钮；
- 发布日志；
- 评论管理；
- 用户管理；
- 站点设置。

不要让 Dashboard 成为第二个内容编辑器。

---

# 一个更适合你的简化版流程

## 写文章

```bash
# 编辑
content/posts/my-post.md

# 检查
bun run content:check

# 预览发布
bun run publish -- --scope posts --dry-run

# 确认后发布
bun run publish -- --scope posts

# 提交源文件
git add content/posts
git commit -m "content: add post"
git push
```

更理想的顺序是先 commit 再发布，或者由 CI 在 Git push 后发布。

## 加入 Gallery

```bash
# 原始照片放入本地输入目录
content/.gallery-input/travel/

# 转换并生成 album.yaml / WebP
bun run gallery:prepare

# 预览
bun run publish -- --scope galleries --dry-run

# 发布
bun run publish -- --scope galleries

# 提交生成后的 WebP 和 album.yaml
git add content/photo-gallery
git commit -m "content: add gallery"
git push
```

这里可以继续保留原始照片不进 Git，但应该明确：

```text
原始照片必须由用户自行备份
```

---

# 建议采用“渐进式简化”，不要一次重写

可以分成三个阶段。

## 阶段一：先冻结新增复杂度

暂时不要继续增加：

- 新的同步入口；
- 新的 Snapshot 能力；
- 新的双向 merge；
- 新的 Gallery Dashboard 编辑功能；
- 新的自动恢复策略。

先把架构边界写清楚：

```text
内容源只允许从 Git 流入数据库
数据库不反向修改内容源
```

## 阶段二：移除危险的反向能力

优先处理：

1. 禁用 Dashboard 文章回写；
2. 禁用 `sync:pull`；
3. 禁用 Gallery patch 回写；
4. 禁用数据库封面自动写回 Markdown；
5. 让 dry-run 真正只读；
6. 把 Dashboard 同步统一为单向 publish。

这些改动会立即减少数据覆盖风险。

## 阶段三：清理内部模型

之后再考虑删除：

- `mergeBase`
- `revision`
- `syncStatus` 中不再需要的状态
- `sync:pull`
- `gallery:pull`
- `SiteSnapshot`
- 复杂的 scope retry
- 旧 DTO 适配层
- 旧兼容入口

数据库字段不必一次性删除，可以先标记 deprecated，经过一个阶段后再 migration 清理。

---

# 是否应该保留 Gallery？

应该保留，但不应该让 Gallery 继承 Blog 的同步复杂度。

Gallery 实际上更适合：

```text
文件目录 + album.yaml
```

而不是：

```text
文件目录 + album.yaml
+ gallery.yaml
+ PostgreSQL metadata
+ Cloudinary metadata
+ mergeBase
+ revision
+ remote/local conflict
+ Dashboard patch
```

建议把 Gallery 的数据库模型尽量缩小为：

```text
Gallery
- slug
- title
- description
- status
- cover
- metadata

GalleryImage
- galleryId
- sourcePath
- url
- thumbnailUrl
- width
- height
- exif
- sortOrder
- hidden
```

只保留必要的同步字段：

```text
fileHash
lastSyncedAt
```

不一定需要完整的冲突状态机。

---

# 最终建议

如果这是我维护的个人项目，我会选择：

```text
Git-first
单向发布
Dashboard 只读/运维
Cloudinary 只负责媒体
数据库只做运行时副本
Git 负责内容版本恢复
数据库备份负责运行时恢复
```

而不是继续维护：

```text
Git ↔ Database ↔ Dashboard ↔ Cloudinary
```

后者更像多人协作 CMS 或内容平台需要的架构，不像个人博客真正需要的架构。

一句话总结：

> **Stage 9 的成果不一定要全部保留。现在最有价值的下一阶段，可能不是 Stage 10，而是一次“架构减法”：删除双向同步，把系统重新收敛成可靠、可理解、单向发布的个人内容系统。**