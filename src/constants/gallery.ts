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

export const GALLERY_RULES = {
	idMaxLength: 128,
	title: { minLength: 1, maxLength: 200 },
	descriptionMaxLength: 5000,
	coverMaxLength: 500,
	tag: { minLength: 1, maxLength: 80 },
	maxTags: 50,
	locationMaxLength: 200,
	altMaxLength: 300,
	sortOrder: { min: 0, max: 100000 },
} as const

export const GALLERY_CONTENT_ROOT = path.join(
	process.cwd(),
	'content/photo-gallery',
)
