import type { InferSelectModel } from 'drizzle-orm'
import type { galleryImages } from '@/db/schema'

export type GalleryImageSyncStatus =
	| 'LOCAL_ONLY'
	| 'REMOTE_ONLY'
	| 'CONFLICT'
	| 'IN_SYNC'
	| 'PENDING_DELETE'
	| 'ARCHIVED'
export type GallerySyncStatus = GalleryImageSyncStatus

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

export type GalleryImage = InferSelectModel<typeof galleryImages>

export interface GalleryImageFrontmatter {
	file: string
	title?: string
	description?: string
	alt?: string
	order?: number
	hidden?: boolean
}
