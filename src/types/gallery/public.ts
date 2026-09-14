import type { GalleryStatus } from './album'
import type { GalleryExif } from './image'

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
	tags: string[]
	cover: string | null
	status: GalleryStatus
	location?: string
	images: GalleryPublicImage[]
}
