import pinyin from 'pinyin'
import slugify from 'slugify'

/**
 * 生成支持中英文的 URL 友好 slug
 * 中文字符会转换为拼音，英文保持原样
 */
export function generateSlug(title: string): string {
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
