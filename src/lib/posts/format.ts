import { format, isValid, parseISO } from 'date-fns'

/** Formats a published date, returning the original value when it cannot be parsed. */
export const formatPublishedDate = (value: string) => {
	const date = parseISO(value)
	if (!isValid(date)) return value
	return format(date, 'MMMM d, yyyy')
}

/** Estimates word count and reading time for Markdown with mixed Chinese and English text. */
export function calculateReadingTime(
	content: string | null | undefined,
	wordsPerMinute = 300,
): { minutes: number; text: string; wordsCount: number } {
	if (!content || typeof content !== 'string') {
		return { minutes: 1, text: '1 min', wordsCount: 0 }
	}

	const cleanText = content
		.replace(/```[\s\S]*?```/g, '')
		.replace(/<[^>]+>/g, '')
		.replace(/[#*`_~[\]()!-]/g, '')
		.trim()

	const chineseMatches = cleanText.match(/[\u4e00-\u9fa5]/g) || []
	const englishMatches =
		cleanText.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9_-]+/g) || []

	const totalWords = chineseMatches.length + englishMatches.length
	const minutes = Math.max(1, Math.ceil(totalWords / wordsPerMinute))

	return {
		minutes,
		text: `${minutes} min`,
		wordsCount: totalWords,
	}
}
