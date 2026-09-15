import path from 'node:path'

export const GALLERY_MAX_WIDTH = 4000
export const GALLERY_MAX_HEIGHT = 3000
export const GALLERY_WEBP_QUALITY = 95
export const GALLERY_WEBP_EFFORT = 6

export const GALLERY_LAYOUTS = ['masonry', 'grid', 'justified'] as const
export const GALLERY_SORTS = ['filename', 'mtime', 'manual'] as const
export const GALLERY_ALBUM_STATUSES = [
	'published',
	'draft',
	'archived',
] as const

export const GALLERY_CONTENT_ROOT = path.join(
	process.cwd(),
	'content/photo-gallery',
)
