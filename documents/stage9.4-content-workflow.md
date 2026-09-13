# Stage 9.4：内容工作流产品化

## 1. 新增命令

| 命令 | 默认行为 | 写入/副作用 |
| :--- | :--- | :--- |
| `bun run content:format` | 预览 Markdown Frontmatter 和 `album.yaml` 格式变化 | 不写入 |
| `bun run content:format -- --write` | 写入白名单结构格式 | 只写入 Frontmatter/YAML，不修改 Markdown 正文 |
| `bun run content:verify` | 检查、安全边界、格式预览、索引预览、三种 dry-run、`git diff --check` | 不真实同步 |
| `bun run content:prepare` | 面向提交前的检查和预览 | 不写入、不 commit、不 push、不真实同步 |

`content:fix` 作为历史兼容命令保留。新工作流不依赖它，因为它的旧行为可能直接修复文件；新用户应优先使用 `content:format` 的 dry-run/`--write` 显式流程。

## 2. 格式化边界

格式化器只读取和重写：

- Markdown 文件的 YAML Frontmatter；
- Gallery 相册的 `album.yaml`。

格式化器不会：

- 修改 Markdown 正文；
- 自动补充或删除业务字段；
- 生成或手工修改 `gallery.yaml`；
- 处理 `.gallery-input` 原始媒体；
- 执行数据库写入或 Cloudinary 操作。

默认 dry-run 是安全默认值，必须显式传入 `--write` 才能写入。

## 3. 内容安全边界

验证流程会检查：

- `content/.gallery-input/` 是否被 Git 跟踪；
- `content/photo-gallery/` 是否出现 JPEG、PNG、GIF、TIFF、BMP、RAW、ORF、CR2、CR3、NEF 或 ARW；
- Gallery 索引是否可以在 `--dry-run` 下生成；
- `gallery.yaml` 是否仍由 `gallery:index` 负责生成。

`.gallery-input` 必须保持 Git 忽略，原始图片不得提交。处理后的 Gallery WebP 和人工编辑的 `album.yaml` 才能进入内容提交流程。

## 4. 验证流水线

`content:verify` 执行：

```text
安全边界检查
  ↓
content:check --no-examples
  ↓
content:format --dry-run
  ↓
gallery:index --dry-run
  ↓
sync --scope posts --dry-run --json
sync --scope galleries --dry-run --json
sync --scope all --dry-run --json
  ↓
git diff --check
```

任一步骤失败返回非零退出码。`content:prepare` 采用同样的安全默认值，但只执行全站 dry-run，适合作为日常提交前入口。

## 5. 用户流程

```bash
$EDITOR content/posts/my-post.md
bun run content:prepare
git diff -- content/posts content/photo-gallery
git diff --check
git status --short
git add content/posts content/photo-gallery
git commit -m "content: update blog"
bun run sync
```

Gallery 原始图片必须先放入 `content/.gallery-input/{album}/`，执行同步或图片处理生成 WebP，再运行 `gallery:index` 和 `content:prepare`。不要把原始输入复制到 `content/photo-gallery/`。