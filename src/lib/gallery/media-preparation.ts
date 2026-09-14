import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as exifr from 'exifr'
import sharp from 'sharp'
import {
	GALLERY_MAX_HEIGHT,
	GALLERY_MAX_WIDTH,
	GALLERY_WEBP_EFFORT,
	GALLERY_WEBP_QUALITY,
} from '@/lib/constants/gallery'
import { parseGalleryExif } from '@/lib/gallery/exif'
import type { GalleryExif } from '@/types/gallery'

export interface PreparedGalleryImage {
	file: string
	buffer: Buffer
	width: number
	height: number
	hash: string
	size: number
	mtime: Date
	exif: GalleryExif | null
}

/** Convert an input image to the Git-managed, privacy-filtered Gallery WebP. */
export async function prepareGalleryImage(
	sourcePath: string,
): Promise<PreparedGalleryImage> {
	const [sourceBuffer, stat] = await Promise.all([
		fs.readFile(sourcePath),
		fs.stat(sourcePath),
	])
	const sourceMetadata = await sharp(sourceBuffer).metadata()
	const rawExif = await exifr
		.parse(sourceBuffer, { translateValues: false, tiff: true, ifd0: {} })
		.catch(() => null)
	const processed = await sharp(sourceBuffer)
		.rotate()
		.resize({
			width: GALLERY_MAX_WIDTH,
			height: GALLERY_MAX_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true,
		})
		.webp({ quality: GALLERY_WEBP_QUALITY, effort: GALLERY_WEBP_EFFORT })
		.toBuffer()
	const processedMetadata = await sharp(processed).metadata()

	return {
		file: `${path.basename(sourcePath, path.extname(sourcePath))}.webp`,
		buffer: processed,
		width: processedMetadata.width ?? sourceMetadata.width ?? 0,
		height: processedMetadata.height ?? sourceMetadata.height ?? 0,
		hash: createHash('sha256').update(processed).digest('hex'),
		size: processed.byteLength,
		mtime: stat.mtime,
		exif: parseGalleryExif(rawExif),
	}
}
