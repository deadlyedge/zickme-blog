import type { GalleryExif } from '@/types/gallery'

export const GALLERY_EXIF_KEYS = [
	'make',
	'model',
	'lensModel',
	'iso',
	'aperture',
	'exposureTime',
	'focalLength',
	'capturedAt',
] as const satisfies readonly (keyof GalleryExif)[]

const EXIF_ALIASES: Record<(typeof GALLERY_EXIF_KEYS)[number], string[]> = {
	make: ['Make', 'make'],
	model: ['Model', 'model'],
	lensModel: ['LensModel', 'lensModel'],
	iso: ['ISO', 'iso'],
	aperture: ['FNumber', 'ApertureValue', 'aperture'],
	exposureTime: ['ExposureTime', 'exposureTime'],
	focalLength: ['FocalLength', 'focalLength'],
	capturedAt: ['DateTimeOriginal', 'CreateDate', 'capturedAt'],
}

const MAX_EXIF_TEXT_LENGTH = 160

function normalizeText(value: unknown): string | undefined {
	if (value === undefined || value === null) return undefined
	const text = String(value).trim().slice(0, MAX_EXIF_TEXT_LENGTH)
	return text || undefined
}

function normalizeIso(value: unknown): number | undefined {
	const number =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number(value)
				: Number.NaN
	if (!Number.isFinite(number)) return undefined
	return Math.max(0, Math.round(number))
}

/** Extract only the public EXIF allowlist. GPS and device identifiers are never copied. */
export function parseGalleryExif(value: unknown): GalleryExif | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value))
		return null
	const source = value as Record<string, unknown>
	const result: GalleryExif = {}
	for (const key of GALLERY_EXIF_KEYS) {
		const raw = EXIF_ALIASES[key]
			.map((alias) => source[alias])
			.find((item) => item !== undefined && item !== null)
		const normalized = key === 'iso' ? normalizeIso(raw) : normalizeText(raw)
		if (normalized !== undefined) result[key] = normalized as never
	}
	return Object.keys(result).length > 0 ? result : null
}
