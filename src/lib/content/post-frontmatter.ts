import type { StatusType } from '@/types'
import type { MarkdownFrontmatter } from './post-types'

const STATUS_TYPES: readonly StatusType[] = [
	'PUBLISHED',
	'DRAFT',
	'ARCHIVED',
	'PENDING',
	'SPAM',
]

export function parseStatusType(
	statusStr: string | undefined,
	draft: boolean | undefined,
): StatusType {
	if (draft === true) return 'DRAFT'
	const normalized = statusStr?.toUpperCase()
	if (normalized && STATUS_TYPES.includes(normalized as StatusType))
		return normalized as StatusType
	return 'PUBLISHED'
}

export function normalizeTags(
	tagsInput: MarkdownFrontmatter['tags'],
): string[] {
	if (!tagsInput) return []
	if (Array.isArray(tagsInput)) return tagsInput
	return tagsInput
		.split(',')
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0)
}

export function generateTitleFromFileName(fileName: string): string {
	return fileName
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (letter) => letter.toUpperCase())
}
