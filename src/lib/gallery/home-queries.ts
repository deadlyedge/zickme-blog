import { and, asc, count, desc, eq, max } from 'drizzle-orm'
import { db } from '@/db'
import { galleries, galleryImageComments, galleryImages } from '@/db/schema'
import { parseGalleryExif } from '@/lib/gallery/exif'
import { parseGalleryTags } from '@/lib/gallery/gallery-public'
import type { HomeGalleryImage, HomeRecentGallery } from '@/types/content/home'

type GalleryImageRow = typeof galleryImages.$inferSelect

function getMetadata(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {}
}

function isPublicImage(image: GalleryImageRow): boolean {
	return !image.hidden && typeof image.url === 'string' && image.url.length > 0
}

function findCoverImage(
	gallery: { cover: string | null },
	images: GalleryImageRow[],
): GalleryImageRow | undefined {
	const configuredCover = gallery.cover?.replaceAll('\\', '/')
	const configured = configuredCover
		? images.find(
				(image) =>
					image.sourcePath === configuredCover ||
					image.sourcePath.endsWith(`/${configuredCover}`),
			)
		: undefined
	return (
		(configured && isPublicImage(configured) ? configured : undefined) ??
		images.find(isPublicImage)
	)
}

export async function fetchRecentGalleriesForHome(
	limit = 2,
): Promise<HomeRecentGallery[]> {
	const results = await db.query.galleries.findMany({
		where: eq(galleries.status, 'PUBLISHED'),
		orderBy: [desc(galleries.publishedAt), desc(galleries.updatedAt)],
		with: {
			images: {
				where: eq(galleryImages.hidden, false),
				orderBy: [asc(galleryImages.sortOrder)],
			},
		},
	})

	return results
		.map((gallery) => {
			const image = findCoverImage(gallery, gallery.images)
			if (!image?.url) return null
			return {
				slug: gallery.slug,
				title: gallery.title,
				href: `/gallery/${gallery.slug}`,
				coverUrl: image.url,
				coverTitle: image.title,
				width: image.width,
				height: image.height,
			}
		})
		.filter((gallery): gallery is HomeRecentGallery => gallery !== null)
		.slice(0, limit)
}

export async function fetchTopDiscussedGalleryImages(
	limit = 2,
): Promise<HomeGalleryImage[]> {
	const rows = await db
		.select({
			image: galleryImages,
			gallery: galleries,
			commentCount: count(galleryImageComments.id),
			lastCommentAt: max(galleryImageComments.createdAt),
		})
		.from(galleryImages)
		.innerJoin(galleries, eq(galleries.id, galleryImages.galleryId))
		.leftJoin(
			galleryImageComments,
			and(
				eq(galleryImageComments.galleryImageId, galleryImages.id),
				eq(galleryImageComments.status, 'PUBLISHED'),
				eq(galleryImageComments.deleted, false),
			),
		)
		.where(
			and(eq(galleries.status, 'PUBLISHED'), eq(galleryImages.hidden, false)),
		)
		.groupBy(galleryImages.id, galleries.id)
		.orderBy(
			desc(count(galleryImageComments.id)),
			desc(max(galleryImageComments.createdAt)),
			desc(galleries.publishedAt),
		)
		.limit(limit)

	return rows
		.filter(({ image }) => isPublicImage(image))
		.map(({ image, gallery, commentCount }) => {
			const metadata = getMetadata(gallery.metadata)
			const showExif = metadata.showExif === true
			return {
				id: image.id,
				title: image.title,
				href: `/gallery/${gallery.slug}#image-${image.id}`,
				imageUrl: image.url as string,
				thumbnailUrl: image.thumbnailUrl,
				gallerySlug: gallery.slug,
				galleryTitle: gallery.title,
				tags: parseGalleryTags(metadata),
				width: image.width,
				height: image.height,
				exif: showExif ? parseGalleryExif(image.exif) : null,
				commentCount: Number(commentCount),
			}
		})
}
