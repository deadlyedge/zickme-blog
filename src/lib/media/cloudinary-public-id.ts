import {
	CLOUDINARY_ROOT_PREFIX,
	GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
} from '@/constants/cloudinary'

export {
	GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
} from '@/constants/cloudinary'

export function sanitizeCloudinarySegment(value: string): string {
	return value
		.normalize('NFKC')
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function buildScopedPublicId(
	prefix: string,
	segments: string[],
	context: string,
): string {
	const normalizedSegments = segments.map(sanitizeCloudinarySegment)
	if (normalizedSegments.some((segment) => !segment))
		throw new Error(`Invalid Cloudinary public ID: ${context}`)
	return `${prefix}/${normalizedSegments.join('/')}`
}

export function buildPostPublicId(postSlug: string, imagePath: string): string {
	const imageName = imagePath.split(/[\\/]/).pop() ?? imagePath
	return buildScopedPublicId(
		POST_CLOUDINARY_PUBLIC_ID_PREFIX,
		[postSlug, imageName.replace(/\.[^/.]+$/, '')],
		`${postSlug}/${imagePath}`,
	)
}

export function buildGalleryPublicId(
	albumSlug: string,
	fileName: string,
): string {
	return buildScopedPublicId(
		GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
		[albumSlug, fileName.replace(/\.webp$/i, '')],
		`${albumSlug}/${fileName}`,
	)
}

export function toCloudinaryPublicId(publicId: string): string {
	const normalized = publicId
		.split('/')
		.map(sanitizeCloudinarySegment)
		.filter(Boolean)
		.join('/')
	if (!normalized) throw new Error(`Invalid Cloudinary public ID: ${publicId}`)
	return normalized
}

export function toCloudinaryRootedPublicId(publicId: string): string {
	const normalized = toCloudinaryPublicId(publicId)
	return normalized.startsWith(`${CLOUDINARY_ROOT_PREFIX}/`)
		? normalized
		: `${CLOUDINARY_ROOT_PREFIX}/${normalized}`
}
