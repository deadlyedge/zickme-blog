import path from 'node:path'
import pinyin from 'pinyin'
import slugify from 'slugify'

/**
 * 生成支持中英文的 URL 友好 slug
 * 中文字符会转换为拼音，英文保持原样
 */
function generateSlug(title: string): string {
	// 检查是否包含中文字符
	const hasChinese = /[\u4e00-\u9fff]/.test(title)

	if (hasChinese) {
		// 将中文转换为拼音
		const pinyinResult = pinyin(title, { style: pinyin.STYLE_NORMAL })
		const pinyinString = pinyinResult.flat().join(' ')
		return slugify(pinyinString, { lower: true, strict: true })
	} else {
		// 原英文处理逻辑
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
	}
}

/**
 * 从文件路径生成slug，支持多级文件夹
 */
export function generateSlugFromPath(filePath: string, postsDir: string): string {
	const relativePath = path.relative(postsDir, filePath) // blogs/tech/前端开发.md
	const pathWithoutExt = relativePath.replace(/\.md$/, '') // blogs/tech/前端开发
	const pathParts = pathWithoutExt.split(path.sep) // ['blogs', 'tech', '前端开发']

	// 对每个路径部分进行slugify
	const slugParts = pathParts.map((part) => generateSlug(part))

	return slugParts.join('-') // blogs-tech-前端开发
}
