import {
	Funnel_Display,
	Noto_Sans,
	Noto_Serif,
	Noto_Serif_SC,
} from 'next/font/google'
import { clsx, type ClassValue } from 'clsx'
import { parseISO, isValid, format } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import pinyin from 'pinyin'
import slugify from 'slugify'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

//写一个方法来处理类型问题，从一个复合类型如'number | T'中剔除'number'
// export type ExcludeNumber<T> = T extends number ? never : T

/**
 * 从 cover 对象中安全提取 URL，确保返回 string | null
 */
export function getCoverUrl(cover: unknown): string | null {
	if (cover && typeof cover === 'object' && 'url' in cover) {
		const url = (cover as { url: unknown }).url
		if (typeof url === 'string' && url.trim() !== '') {
			return url
		}
	}
	return null
}

/**
 * 从联合类型如 'number | T' 中剔除 'number'，返回 T | null
 * 用于处理 Payload depth 不足时关联字段返回 ID 的情况
 */
export type ExcludeNumber<T> = T extends number ? never : T

export function safeExtract<T>(value: T): ExcludeNumber<T> | null {
	return typeof value === 'number' ? null : (value as ExcludeNumber<T>) || null
}

export const formatPublishedDate = (value: string) => {
	const date = parseISO(value)
	if (!isValid(date)) return value
	return format(date, 'MMMM d, yyyy')
}

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

const notoSerif = Noto_Serif({
	variable: '--font-noto-serif',
	subsets: ['latin'],
})

const notoSans = Noto_Sans({
	variable: '--font-noto-sans',
	subsets: ['latin'],
	weight: ['400'],
})

const notoSerifSC = Noto_Serif_SC({
	variable: '--font-noto-serif-sc',
	subsets: ['latin'],
	weight: ['400'],
})

const funnelDisplay = Funnel_Display({
	variable: '--font-funnel',
	subsets: ['latin'],
	weight: ['300', '600', '800'],
})

/**
 * 全局字体工具
 */
export const fonts = {
	noto: notoSerif.className,
	funnel: funnelDisplay.className,
	sans: notoSans.className,
	notoSC: notoSerifSC.className,
}
