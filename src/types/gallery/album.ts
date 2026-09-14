import type { InferSelectModel } from 'drizzle-orm'
import type { galleries } from '@/db/schema'
import type { GalleryImageFrontmatter } from './image'

export type GalleryStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
export type GalleryLayout = 'masonry' | 'grid' | 'justified'
export type GallerySort = 'filename' | 'mtime' | 'manual'

export type Gallery = InferSelectModel<typeof galleries>

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
