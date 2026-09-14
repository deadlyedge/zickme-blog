import type { GalleryPublic, GalleryPublicImage } from '@/types/gallery'

export type GalleryImageVariant = 'full' | 'thumbnail'

export function getGalleryImageUrl(
	image: GalleryPublicImage,
	variant: GalleryImageVariant = 'full',
): string {
	if (variant === 'thumbnail') return image.thumbnailUrl ?? image.url
	return image.url
}

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
