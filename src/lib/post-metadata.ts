import type { PostLink, PostLinkType, PostMetadata } from '@/types'

const linkTypes: PostLinkType[] = [
	'github',
	'twitter',
	'demo',
	'documentation',
	'figma',
	'paper',
	'website',
	'other',
]

function isHttpUrl(value: unknown): value is string {
	if (typeof value !== 'string' || value.trim() === '') return false
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

function inferLinkType(url: string, explicitType?: unknown): PostLinkType {
	if (
		typeof explicitType === 'string' &&
		linkTypes.includes(explicitType as PostLinkType)
	) {
		return explicitType as PostLinkType
	}
	const hostname = new URL(url).hostname.toLowerCase()
	if (hostname.includes('github.com')) return 'github'
	if (hostname.includes('twitter.com') || hostname === 'x.com') return 'twitter'
	if (hostname.includes('figma.com')) return 'figma'
	if (hostname.includes('arxiv.org') || hostname.endsWith('.pdf'))
		return 'paper'
	if (hostname.includes('docs.') || hostname.includes('readthedocs'))
		return 'documentation'
	return 'website'
}

function normalizeLink(value: unknown): PostLink | null {
	if (typeof value === 'string') {
		return isHttpUrl(value) ? { url: value, type: inferLinkType(value) } : null
	}
	if (!value || typeof value !== 'object' || !('url' in value)) return null
	const candidate = value as { url?: unknown; label?: unknown; type?: unknown }
	if (!isHttpUrl(candidate.url)) return null
	return {
		url: candidate.url,
		type: inferLinkType(candidate.url, candidate.type),
		...(typeof candidate.label === 'string' && candidate.label.trim()
			? { label: candidate.label.trim() }
			: {}),
	}
}

export function normalizePostMetadata(input: unknown): PostMetadata {
	const source =
		input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
	const rawLinks = Array.isArray(source.links) ? source.links : []
	const links = rawLinks
		.map(normalizeLink)
		.filter((link): link is PostLink => link !== null)

	for (const [key, type] of [
		['github', 'github'],
		['twitter', 'twitter'],
		['x', 'twitter'],
		['demo', 'demo'],
		['sourceUrl', 'documentation'],
		['source', 'documentation'],
		['figma', 'figma'],
		['paper', 'paper'],
	] as const) {
		const value = source[key]
		if (isHttpUrl(value) && !links.some((link) => link.url === value)) {
			links.push({
				url: value,
				type: inferLinkType(value, key === 'source' ? undefined : type),
			})
		}
	}

	return {
		links,
		...(typeof source.category === 'string'
			? { category: source.category }
			: {}),
		...(typeof source.series === 'string' ? { series: source.series } : {}),
		...(typeof source.canonicalUrl === 'string' &&
		isHttpUrl(source.canonicalUrl)
			? { canonicalUrl: source.canonicalUrl }
			: {}),
		...(typeof source.outdatedWarning === 'string'
			? { outdatedWarning: source.outdatedWarning }
			: {}),
		...(source.layout === 'article' ||
		source.layout === 'gallery' ||
		source.layout === 'photo'
			? { layout: source.layout }
			: {}),
	}
}

export function getPostLinks(
	metadata: unknown,
	sourceUrl?: string | null,
): PostLink[] {
	const normalized = normalizePostMetadata(metadata)
	if (
		sourceUrl &&
		isHttpUrl(sourceUrl) &&
		!normalized.links.some((link) => link.url === sourceUrl)
	) {
		normalized.links.push({
			url: sourceUrl,
			type: inferLinkType(sourceUrl),
		})
	}
	return normalized.links
}

export function isOutdatedWarningActive(
	value: string | undefined,
	now = new Date(),
): boolean {
	if (!value) return false
	const date = new Date(value)
	return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime()
}
