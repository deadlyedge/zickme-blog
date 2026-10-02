import {
	CLOUDINARY_ROOT_PATH,
	GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
	SITE_CLOUDINARY_PUBLIC_ID_PREFIX,
} from '@/constants/cloudinary'

const UNROOTED_PUBLIC_ID_PREFIXES = [
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
	GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
	SITE_CLOUDINARY_PUBLIC_ID_PREFIX,
]

export interface CloudinaryAssetReference {
	publicId: string
	source: string
}

function stripAssetExtension(value: string): string {
	return value.replace(/\.(avif|gif|heic|jpeg|jpg|png|webp)$/i, '')
}

export function normalizeCloudinaryPublicId(value: string): string | null {
	let decoded = value
	try {
		decoded = decodeURIComponent(value)
	} catch {
		// Values such as Markdown content may contain literal percent signs.
	}
	const normalized = decoded.replace(/^\/+|\/+$/g, '')
	if (!normalized) return null
	if (normalized.startsWith(CLOUDINARY_ROOT_PATH))
		return stripAssetExtension(normalized)
	if (
		UNROOTED_PUBLIC_ID_PREFIXES.some((prefix) =>
			normalized.startsWith(`${prefix}/`),
		)
	)
		return stripAssetExtension(`${CLOUDINARY_ROOT_PATH}${normalized}`)
	return null
}

export function extractCloudinaryPublicId(value: string): string | null {
	if (!value) return null
	try {
		const url = new URL(value)
		if (!url.hostname.endsWith('res.cloudinary.com')) return null
		const uploadMarker = '/image/upload/'
		const markerIndex = url.pathname.indexOf(uploadMarker)
		if (markerIndex < 0) return null
		const deliveryPath = url.pathname.slice(markerIndex + uploadMarker.length)
		const segments = deliveryPath.split('/').filter(Boolean)
		const rootIndex = segments.indexOf('myblog')
		if (rootIndex < 0) return null
		return normalizeCloudinaryPublicId(segments.slice(rootIndex).join('/'))
	} catch {
		return null
	}
}

export function collectCloudinaryReferences(
	values: Array<{ value: string | null | undefined; source: string }>,
): Map<string, CloudinaryAssetReference> {
	const references = new Map<string, CloudinaryAssetReference>()
	for (const { value, source } of values) {
		if (!value) continue
		const urls = value.match(/https?:\/\/[^\s)"'<>]+/g) ?? []
		for (const candidate of urls) {
			const publicId = extractCloudinaryPublicId(candidate)
			if (publicId) references.set(publicId, { publicId, source })
		}
		const publicId = normalizeCloudinaryPublicId(value)
		if (publicId) references.set(publicId, { publicId, source })
	}
	return references
}

export function collectSiteProfileAvatarReferences(
	rows: Array<{ avatar: string | null }>,
): Map<string, CloudinaryAssetReference> {
	return collectCloudinaryReferences(
		rows.map(({ avatar }) => ({
			value: avatar,
			source: 'SiteProfile:avatar',
		})),
	)
}

export function getUnreferencedAssetIds(
	assets: Array<{ public_id: string }>,
	references: ReadonlyMap<string, CloudinaryAssetReference>,
): string[] {
	return assets
		.map((asset) => normalizeCloudinaryPublicId(asset.public_id))
		.filter((publicId): publicId is string => Boolean(publicId))
		.filter((publicId) => !references.has(publicId))
}
