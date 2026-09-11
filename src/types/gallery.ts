import type { InferSelectModel } from 'drizzle-orm'
import type { galleries, galleryImages } from '@/db/schema'

export type GalleryStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
export type GalleryImageSyncStatus =
	| 'LOCAL_ONLY'
	| 'REMOTE_ONLY'
	| 'CONFLICT'
	| 'IN_SYNC'
	| 'PENDING_DELETE'
export type GalleryLayout = 'masonry' | 'grid' | 'justified'
export type GallerySort = 'filename' | 'mtime' | 'manual'

export interface GalleryExif {
	make?: string
	model?: string
	lensModel?: string
	iso?: number
	aperture?: string
	exposureTime?: string
	focalLength?: string
	capturedAt?: string
}

export type Gallery = InferSelectModel<typeof galleries>
export type GalleryImage = InferSelectModel<typeof galleryImages>

export interface GalleryImageFrontmatter {
	file: string
	title?: string
	description?: string
	alt?: string
	order?: number
	hidden?: boolean
}

export interface GalleryAlbumFrontmatter {
	slug?: string
	title?: string
	description?: string
	date?: string
	status?: 'published' | 'draft' | 'archived'
	cover?: string
	tags?: string[]
	location?: string
	layout?: GalleryLayout
	sort?: GallerySort
	showExif?: boolean
	showLocation?: boolean
	images?: GalleryImageFrontmatter[]
}

export interface GalleryIndexEntry {
	slug: string
	title: string
	description: string
	path: string
	cover: string | null
	imageCount: number
	status: 'published' | 'draft' | 'archived'
	updatedAt: string
}

export interface GalleryPublicImage {
	id: string
	url: string
	thumbnailUrl: string | null
	title: string | null
	description: string | null
	alt: string
	width: number | null
	height: number | null
	exif: GalleryExif | null
}

export interface GalleryPublic {
	slug: string
	title: string
	description: string | null
	cover: string | null
	status: GalleryStatus
	images: GalleryPublicImage[]
}
