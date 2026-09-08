import { type ClassValue, clsx } from 'clsx'
import { format, isValid, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

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

export const formatPublishedDate = (value: string) => {
	const date = parseISO(value)
	if (!isValid(date)) return value
	return format(date, 'MMMM d, yyyy')
}

/**
 * 估算 Markdown 文本的阅读时长与字数统计
 * @param content Markdown 正文
 * @param wordsPerMinute 中英文混合阅读速度（默认每分钟 300 字）
 */
export function calculateReadingTime(
	content: string | null | undefined,
	wordsPerMinute = 300,
): { minutes: number; text: string; wordsCount: number } {
	if (!content || typeof content !== 'string') {
		return { minutes: 1, text: '1 分钟阅读', wordsCount: 0 }
	}

	// 移除 HTML 标签和 Markdown 常见符号
	const cleanText = content
		.replace(/```[\s\S]*?```/g, '') // 去除代码块
		.replace(/<[^>]+>/g, '') // 去除 HTML
		.replace(/[#*`_~[\]()!-]/g, '') // 去除 Markdown 特殊符号
		.trim()

	// 统计中文字符数与英文单词数
	const chineseMatches = cleanText.match(/[\u4e00-\u9fa5]/g) || []
	const englishMatches =
		cleanText.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9_-]+/g) || []

	const totalWords = chineseMatches.length + englishMatches.length
	const minutes = Math.max(1, Math.ceil(totalWords / wordsPerMinute))

	return {
		minutes,
		text: `${minutes} 分钟阅读`,
		wordsCount: totalWords,
	}
}

/**
 * 将颜色字符串转换为 Tailwind CSS text-[hsl(...)] 格式
 * 支持 hex (#333, #333333), hsl(h,s%,l%), rgb(r,g,b)
 * 如果输入无效或为空，返回 'text-foreground'
 */
export function convertToTailwindColor(
	color: string | null | undefined,
): string {
	if (!color || typeof color !== 'string') {
		return 'foreground'
	}

	color = color.trim()

	// 如果已经是 text-[hsl(...)] 格式，直接返回
	if (color.startsWith('[hsl(') && color.endsWith(')]')) {
		return color
	}

	// 如果是 Tailwind 内置类，直接返回
	if (color === 'foreground') {
		return color
	}

	try {
		let hsl: { h: number; s: number; l: number }

		// 处理 hex
		if (color.startsWith('#')) {
			hsl = hexToHsl(color)
		}
		// 处理 hsl
		else if (color.startsWith('hsl(') || color.startsWith('hsla(')) {
			hsl = parseHsl(color)
		}
		// 处理 rgb
		else if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
			const rgb = parseRgb(color)
			hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
		}
		// 其他格式不支持
		else {
			return 'foreground'
		}

		// 转换为 text-[hsl(...)] 格式
		return `[hsl(${Math.round(hsl.h)},${Math.round(hsl.s)}%,${Math.round(hsl.l)}%)]`
	} catch {
		return 'foreground'
	}
}

/**
 * 将 hex 颜色转换为 HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
	// 移除 #
	hex = hex.replace('#', '')

	// 扩展 3 位 hex 到 6 位
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map((c) => c + c)
			.join('')
	}

	if (hex.length !== 6) {
		throw new Error('Invalid hex color')
	}

	const r = parseInt(hex.slice(0, 2), 16) / 255
	const g = parseInt(hex.slice(2, 4), 16) / 255
	const b = parseInt(hex.slice(4, 6), 16) / 255

	return rgbToHsl(r, g, b)
}

/**
 * 解析 HSL 字符串
 */
function parseHsl(hsl: string): { h: number; s: number; l: number } {
	const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
	if (!match) {
		throw new Error('Invalid HSL color')
	}

	return {
		h: parseInt(match[1], 10),
		s: parseInt(match[2], 10),
		l: parseInt(match[3], 10),
	}
}

/**
 * 解析 RGB 字符串
 */
function parseRgb(rgb: string): { r: number; g: number; b: number } {
	const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
	if (!match) {
		throw new Error('Invalid RGB color')
	}

	return {
		r: parseInt(match[1], 10),
		g: parseInt(match[2], 10),
		b: parseInt(match[3], 10),
	}
}

/**
 * 将 RGB 转换为 HSL
 */
function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (max + min) / 2
	let h: number, s: number

	if (max === min) {
		h = s = 0 // achromatic
	} else {
		const d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			case b:
				h = (r - g) / d + 4
				break
			default:
				h = 0
		}
		h /= 6
	}

	return {
		h: h * 360,
		s: s * 100,
		l: l * 100,
	}
}
