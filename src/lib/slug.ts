import path from 'node:path'
import pinyin from 'pinyin'
import slugify from 'slugify'

/**
 * 生成支持中英文的 URL 友好 slug
 * 中文字符会转换为拼音，英文保持原样
 */
export function generateSlug(text: string): string {
	const hasChinese = /[\u4e00-\u9fff]/.test(text)

	if (hasChinese) {
		const pinyinResult = pinyin(text, { style: pinyin.STYLE_NORMAL })
		const pinyinString = pinyinResult.flat().join(' ')
		return slugify(pinyinString, { lower: true, strict: true })
	}

	return slugify(text, { lower: true, strict: true })
}

/**
 * 从文件路径生成 slug，支持多级文件夹并自动扁平化
 */
export function generateSlugFromPath(
	filePath: string,
	postsDir: string,
): string {
	const relativePath = path.relative(postsDir, filePath)
	const pathWithoutExt = relativePath.replace(/\.md$/, '')
	const pathParts = pathWithoutExt
		.split(path.sep)
		.filter((part) => part.length > 0)

	const slugParts = pathParts.map((part) => generateSlug(part))
	return slugParts.join('-')
}
