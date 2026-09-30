import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export { calculateReadingTime, formatPublishedDate } from './posts/format'
export { convertToTailwindColor } from './theme/color'

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
