import type { GalleryPublic } from '@/types/gallery'

export function parseGalleryTags(metadata: unknown): string[] {
	if (typeof metadata !== 'object' || metadata === null) return []

	const tags = (metadata as { tags?: unknown }).tags
	if (!Array.isArray(tags)) return []

	return Array.from(
		new Set(
			tags.filter(
				(tag): tag is string =>
					typeof tag === 'string' && tag.trim().length > 0,
			),
		),
	)
}

export function filterGalleriesByTag(
	albums: GalleryPublic[],
	activeTag: string | null,
): GalleryPublic[] {
	if (!activeTag) return albums
	return albums.filter((album) => album.tags.includes(activeTag))
}
