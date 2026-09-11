import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import type {
	GalleryExif,
	GalleryPublic,
	GalleryPublicImage,
} from '@/types/gallery'

const PUBLIC_EXIF_KEYS: Array<keyof GalleryExif> = [
	'make',
	'model',
	'lensModel',
	'iso',
	'aperture',
	'exposureTime',
	'focalLength',
	'capturedAt',
]

function toPublicExif(value: unknown): GalleryExif | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value))
		return null

	const source = value as Record<string, unknown>
	const exif: GalleryExif = {}
	for (const key of PUBLIC_EXIF_KEYS) {
		const item = source[key]
		if (typeof item === 'string' || (key === 'iso' && typeof item === 'number'))
			exif[key] = item as never
	}
	return Object.keys(exif).length > 0 ? exif : null
}

function toPublicImage(
	image: typeof galleryImages.$inferSelect,
	showExif: boolean,
): GalleryPublicImage | null {
	if (!image.url) return null
	return {
		id: image.id,
		url: image.url,
		thumbnailUrl: image.thumbnailUrl,
		title: image.title,
		description: image.description,
		alt: image.alt || image.title || 'Gallery image',
		width: image.width,
		height: image.height,
		exif: showExif ? toPublicExif(image.exif) : null,
	}
}

function toPublicGallery(
	gallery: typeof galleries.$inferSelect & {
		images: (typeof galleryImages.$inferSelect)[]
	},
): GalleryPublic {
	const metadata =
		typeof gallery.metadata === 'object' && gallery.metadata !== null
			? (gallery.metadata as Record<string, unknown>)
			: {}
	const showExif = metadata.showExif === true
	const showLocation = metadata.showLocation === true
	const images = gallery.images
		.map((image) => toPublicImage(image, showExif))
		.filter((image): image is GalleryPublicImage => image !== null)
	const configuredCover = gallery.cover?.replaceAll('\\', '/')
	const coverImage = configuredCover
		? gallery.images.find(
				(image) =>
					image.sourcePath === configuredCover ||
					image.sourcePath.endsWith(`/${configuredCover}`),
			)
		: undefined
	const cover =
		configuredCover?.startsWith('http://') ||
		configuredCover?.startsWith('https://')
			? configuredCover
			: coverImage?.url || images[0]?.url || null

	return {
		slug: gallery.slug,
		title: gallery.title,
		description: gallery.description,
		cover,
		status: gallery.status,
		images,
		...(showLocation && typeof metadata.location === 'string'
			? { location: metadata.location }
			: {}),
	}
}

export async function fetchGalleries(): Promise<GalleryPublic[]> {
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
	return results.map(toPublicGallery)
}

export async function fetchGalleryBySlug(
	slug: string,
): Promise<GalleryPublic | null> {
	const gallery = await db.query.galleries.findFirst({
		where: and(eq(galleries.slug, slug), eq(galleries.status, 'PUBLISHED')),
		with: {
			images: {
				where: eq(galleryImages.hidden, false),
				orderBy: [asc(galleryImages.sortOrder)],
			},
		},
	})
	return gallery ? toPublicGallery(gallery) : null
}

export async function fetchAllGallerySlugs(): Promise<string[]> {
	const results = await db
		.select({ slug: galleries.slug })
		.from(galleries)
		.where(eq(galleries.status, 'PUBLISHED'))
	return results.map(({ slug }) => slug)
}
