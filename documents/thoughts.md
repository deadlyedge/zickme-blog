# 想法

- 现有的发布流程还是比较适合github经验比较丰富的用户，希望添加一个本地图形界面以做到一个命令后完成整个内容管理。
  - 拓展/优化本地内容搜集（浏览/添加文件/文件夹，同时支持posts和gallery）流程。
  - 将文件/文件夹中的内容按本项目需求整理后添加到/content。
  - 修改posts frontmatter/gallery album title...修改后按本项目需求整理content文件夹
  - 列表应从数据库获取用户回复，以辅助管理决策，如删除文章会同时删除回复。将删除的文件从/content中移除，建立如/.backup-content文件夹并添加文件创建时间戳到文件名。
  - 并提供git上传和发布全流程管理。
- 进一步明确/标准化publish流程接口，标准化数据库结构，~~以适应后续开放第三方数据维护~~。
- 考虑将现有dashboard中的管理功能移至本地图形界面？从安全性和便利性方面做评估。

# Todos

- 添加一个shortUrl功能用于分享，显示shorturl二维码，为文章和图片添加对应的shorturl，添加路由支持。进入页面后还是应该显示现在的完整内容路径。
- 现在的/gallery地址显示逻辑似乎更适合类似shorturl，我希望进入页面后还是应该显示类似/gallery/album_name/image_title or image_index_in_album 这种形式。
- 考虑添加功能，本地工作台将用户评论合并入md文档
- 考虑添加功能，本地工作流引入ai模块，支持本地ai(ollama/lm studio)进行内容总结/标签生成/精选评论/翻译。
- sitePortrait应该在ui中提供上传/外链，转换后存于本地.webp，等待publish时上传cloudinary。