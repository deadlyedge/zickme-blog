对你这个「本地图片 → GitHub → 自动上传 → Next.js 用 CDN URL」的场景，Cloudinary 只需要做少量设置，主要是拿好凭证、建一个 Upload Preset，并规划好文件夹命名即可。[1][2]

## 1. 基础账号设置（必做）

1. 注册并登录 Cloudinary  
2. 打开 Dashboard → 在页面中间能看到：  
   - `Cloud name`  
   - `API Key`  
   - `API Secret`  
   这三个就是后续写到 GitHub Secrets 里的值。[3][4]

3. 在你的 GitHub 仓库里加 Secrets：  
   - `CLOUDINARY_CLOUD_NAME`  
   - `CLOUDINARY_API_KEY`  
   - `CLOUDINARY_API_SECRET`  

（你之前的 GitHub Actions 方案就用这三个环境变量即可。）

## 2. 上传相关设置（推荐做）

### 2.1 创建 Upload Preset（上传预设）

目的：统一控制上传选项（目标文件夹、是否自动优化、是否要签名等）。[5][1]

步骤：

1. Cloudinary Console → 右上角齿轮 Settings  
2. 左侧导航选择 **Upload**  
3. 滑到 “Upload presets” 区域 → 点击 “Add upload preset”  
4. 关键字段建议：

- **Name**：例如 `myblog_default`（后续可以在脚本或 Action 里用）
- **Signing Mode**：  
  - 如果所有上传都在 GitHub Actions / 自己的后端跑：可以选 **Signed**（更安全）  
  - 如果日后有前端直接上传需求：可以额外建一个 **Unsigned** preset
- **Upload options** 中比较重要的：
  - Folder：例如 `myblog`  
    - 这样所有资源路径会是 `myblog/...`，便于你在脚本里拼 URL  
  - Unique filename：开启（默认），避免重名覆盖  
  - Resource type：保持 `Auto` 即可（图片/视频都支持）

保存后，这个 preset 会在列表中出现一个名字，比如 `myblog_default`。[1]

> 如果用的是 Cloudinary 官方 GitHub Action，它可以直接指定 `folder`、`public_id` 等参数，不强制依赖 preset，但 preset 可以作为统一策略备用。[6][2]

### 2.2（可选）自动优化/压缩

在 Upload Preset 的 **Transformation** 或 **Delivery** 里可以设置：

- `f_auto`（自动选择最优格式，如 WebP）  
- `q_auto`（自动质量优化）  

也可以不在 preset 里设置，而是在前端用 URL 参数控制，比如：  
`https://res.cloudinary.com/xxx/image/upload/f_auto,q_auto/myblog/xxx.webp`。[2]

## 3. 目录 & 命名规划（和你的项目对齐）

结合你现在的路径设计：

- 本地：`content/images/post-1/hero.webp`  
- Cloudinary：建议设置 Folder = `myblog`，上传时保持子路径，这样你最终的 public_id 类似：  
  `myblog/post-1/hero.webp`。[2]

这样你在同步脚本中只要做简单替换：

```ts
// 原 frontmatter.image: "./images/post-1/hero.webp"
const imageUrl = frontmatter.image?.startsWith('./images/')
  ? frontmatter.image.replace(
      './images/',
      'https://res.cloudinary.com/<cloud_name>/image/upload/myblog/'
    )
  : frontmatter.image;
```

你也可以选择在 GitHub Action 中就指定 `folder: 'myblog/post-1'` 这种更精细的结构。

## 4. 安全相关设置（建议检查）

在 Settings → Security 里：

- 关闭不必要的「Unsigned upload」入口（除非你确实需要前端无签名上传）。  
- 确保你不会在前端暴露 `API Secret`（只放在 GitHub/Vercel 的环境变量里）。[3][1]

你的使用模式（全部上传在 GitHub Actions 或后端脚本里完成）是最安全/简单的，不需要在 Cloudinary 额外开启复杂的安全策略。

## 5. 小检查清单

在继续开发之前，可以按这个顺序自查：

1. Dashboard 上能看到：
   - Cloud name / API Key / API Secret  
2. Settings → Upload 里：
   - 有一个 Upload Preset（例如 `myblog_default`），Folder 填了 `myblog`  
3. Assets → Media Library：
   - 手动上传一张测试图，看路径是否按预期落在 `myblog/` 下  
4. 用那张图的 URL 在浏览器打开，确认访问正常  
5. GitHub 仓库里的 Secrets 已经配置完三项

只要上面这些都 OK，你之前那套「GitHub Actions 上传 + 同步脚本拼 URL」就可以直接跑通，无需再在 Cloudinary 做额外复杂配置。[1][2]

[1](https://cloudinary.com/documentation/upload_presets)
[2](https://cloudinary.com/documentation/upload_images)
[3](https://dev.to/hackmamba/uploading-media-in-spring-boot-programmatically-with-cloudinary-35bm)
[4](https://cloudinary.com/documentation/finding_your_credentials_tutorial)
[5](https://cloudinary.com/documentation/dam_admin_upload_presets)
[6](https://cloudinary.com/documentation/upload_programmatically_tutorial)
[7](https://cloudinary.com/documentation/assets_onboarding_dashboard_reports_tutorial)
[8](https://qiita.com/mkthrkw/items/0f665ebba94c8024dda1)
[9](https://cloudinary.com/documentation/sfcc_page_designer_setup_and_configuration)
[10](https://www.youtube.com/watch?v=2Z1oKtxleb4)
[11](https://ja.wordpress.org/plugins/cloudinary-image-management-and-manipulation-in-the-cloud-cdn/)
[12](https://odazie.hashnode.dev/uploading-media-in-spring-boot-programmatically-with-cloudinary)
[13](https://apps.make.com/cloudinary)
[14](https://www.liquidweb.com/wordpress/build/cloudinary/)
[15](https://www.youtube.com/watch?v=txFArKyqhkQ)
[16](https://devcenter.heroku.com/articles/cloudinary)
[17](https://www.youtube.com/watch?v=r1g5UIhaw5k)
[18](https://docs.netlify.com/manage/visual-editor/asset-sources/cloudinary/)
[19](https://bonyou.info/blog/cloudinary/191/)
[20](https://www.youtube.com/watch?v=Iu8rQh51Jk8)


对你这个「从本地文件批量上传、只读、不需要前端直传」的场景，`public_id` 完全可以交给 Cloudinary 自动处理，重点是**有一个稳定的文件夹前缀**，方便你在脚本里拼 URL。这个设置分两块：**ID 生成模式** 和 **前缀路径**。[1][2]

## public ID 该怎么选？

你看到的几个选项含义是：

1. **Auto-generate an unguessable public ID value**  
   - 例如：`myblog/7f3a9bc0asf9sd.webp`  
   - 优点：安全、不会重名。  
   - 缺点：你**无法从本地文件名推导 URL**，必须从上传返回值里拿 `public_id`。

2. **Use the filename of the uploaded file as the public ID**  
   - 例如上传 `hero.webp` → `myblog/hero`。  
   - 优点：可预测，方便从 `hero.webp` 推出 URL。  
   - 缺点：同名文件容易覆盖（配合 Unique filename 选项可以缓解）。[1]

3. **Prepend a path to the public ID**（前缀路径）  
   - 比如前缀 `myblog/`，再加上上面的规则 → `myblog/hero`。  
   - 这是用来统一放在某个文件夹下。

4. **Use the initial asset folder path / Use a custom path**  
   - 前者用你上传时指定的文件夹路径；  
   - 后者写死一个你想要的自定义路径前缀。

## 针对你项目的推荐设置

你现在是：

- 本地放在 `content/images/...`  
- 通过 GitHub Actions 批量上传  
- 同步脚本里希望能**简单地从本地路径映射到 Cloudinary URL**

那比较推荐这样配置：

1. **Generated public ID 选：Use the filename of the uploaded file as the public ID**  
   - 这样 `hero.webp` → `hero`，`post-1-cover.png` → `post-1-cover`。[1]
2. **Prepend a path to the public ID 选：Use a custom path**，填：`myblog`  
   - 最终 public_id 形如：`myblog/hero`、`myblog/post-1-cover`。[2]
3. **开启 Unique filename**（防冲突）  
   - 即便重名，Cloudinary 会在后面加一段 hash，变成 `myblog/hero_xxx`，避免覆盖。

这样你就有一个比较稳定的模式：

- Cloudinary URL 大致是：  
  `https://res.cloudinary.com/<cloud_name>/image/upload/myblog/<文件名或带后缀>.webp`

同步脚本里可以做最简单的替换：

```ts
// frontmatter.image: "./images/hero.webp"
const base = 'https://res.cloudinary.com/<cloud_name>/image/upload/myblog/';
const imageUrl = frontmatter.image?.startsWith('./images/')
  ? base + frontmatter.image.replace('./images/', '').replace(/\.(png|jpg|jpeg|webp)$/i, '')
  : frontmatter.image;
```

如果你不想做任何字符串推导，而是完全依赖 Cloudinary 返回的 `public_id`，那就：

- 在 GitHub Action 或上传脚本里**读取上传响应**，把 `public_id` 写入一个映射文件或直接写入数据库；  
- 这时可以用第一项：**Auto-generate an unguessable public ID value**，安全性最高，但实现稍复杂。[3][1]

## 总结成一句话

- 想「简单可预测」：  
  - 选 **Use the filename of the uploaded file as the public ID** + **Use a custom path（yourblog）**。  
- 想「完全不管 ID，只用上传返回值」：  
  - 选 **Auto-generate an unguessable public ID value**，然后在脚本里用返回的 `public_id` 存数据库。

对你现在的轻量化目标，推荐第一种：**用文件名 + 自定义路径前缀**，实现成本最低，脚本也最好写。[2][1]

[1](https://cloudinary.com/documentation/upload_presets)
[2](https://cloudinary.com/documentation/upload_images)
[3](https://cloudinary.com/documentation/upload_programmatically_tutorial)