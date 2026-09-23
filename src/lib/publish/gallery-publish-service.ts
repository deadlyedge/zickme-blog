import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { stringify } from 'yaml'
import { GALLERY_RAW_EXTENSIONS } from '@/constants/media'
import { GALLERY_ROOT } from '@/lib/gallery/gallery-parser'
import { prepareGalleryImage } from '@/lib/gallery/media-preparation'
import { createLogger } from '@/lib/logger'
import {
	buildGalleryPublicId,
	uploadGalleryWebp,
} from '@/lib/media/gallery-media'
import {
	listGalleryInputFiles,
	readGalleryAlbumConfig,
} from '@/lib/publish/gallery-input-reader'
import { galleryRepository } from '@/lib/publish/gallery-repository'
import type { GalleryImageFrontmatter } from '@/types/gallery'

const logger = createLogger('lib/publish/gallery-publish-service')
const DEFAULT_INPUT_DIR = path.join(process.cwd(), 'content/.gallery-input')
// Gallery keeps substantially more detail than regular post media.

export interface GallerySyncOptions {
	dryRun?: boolean
	inputDir?: string
	galleryRoot?: string
	deleteOld?: boolean
}

export interface GallerySyncSummary {
	dryRun: boolean
	albums: number
	images: number
	processed: number
	uploaded: number
	skipped: number
	unsupported: number
	archived: number
	errors: number
	sourceMissing: string[]
}

export async function publishGallery(
	options: GallerySyncOptions = {},
): Promise<GallerySyncSummary> {
	const dryRun = options.dryRun === true
	const inputRoot = path.resolve(
		/* turbopackIgnore: true */
		options.inputDir ?? process.env.GALLERY_INPUT_DIR ?? DEFAULT_INPUT_DIR,
	)
	const galleryRoot = path.resolve(
		/* turbopackIgnore: true */ options.galleryRoot ?? GALLERY_ROOT,
	)
	const summary: GallerySyncSummary = {
		dryRun,
		albums: 0,
		images: 0,
		processed: 0,
		uploaded: 0,
		skipped: 0,
		unsupported: 0,
		archived: 0,
		errors: 0,
		sourceMissing: [],
	}
	let inputAlbums: import('node:fs').Dirent[] = []
	try {
		inputAlbums = (await fs.readdir(inputRoot, { withFileTypes: true })).filter(
			(entry) => entry.isDirectory(),
		)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			logger.warn('Gallery input directory does not exist; nothing to sync', {
				inputRoot,
			})
			inputAlbums = []
		} else {
			throw error
		}
	}
	if (!dryRun) {
		// Validate credentials before changing local or database state.
		const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
			process.env
		if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET)
			throw new Error(
				'Cloudinary credentials are required for a non-dry Gallery sync',
			)
	}
	const seenSlugs: string[] = []
	const seenSourcePaths = new Set<string>()
	for (const inputAlbum of inputAlbums.sort((a, b) =>
		a.name.localeCompare(b.name),
	)) {
		const sourceFiles = await listGalleryInputFiles(
			path.join(inputRoot, inputAlbum.name),
		)
		if (sourceFiles.length === 0) continue
		const albumDirectory = path.join(galleryRoot, inputAlbum.name)
		if (!dryRun)
			await fs.mkdir(path.join(albumDirectory, 'images'), { recursive: true })
		const config = await readGalleryAlbumConfig(
			albumDirectory,
			sourceFiles.map(
				(file) => `${path.basename(file, path.extname(file))}.webp`,
			),
		)
		const slug = config.data.slug ?? inputAlbum.name
		if (seenSlugs.includes(slug))
			throw new Error(`Gallery slug conflict during sync: ${slug}`)
		seenSlugs.push(slug)
		summary.albums++
		const configuredImages = new Map(
			(config.data.images ?? []).map((image) => [
				path.basename(image.file),
				image,
			]),
		)
		const processedImages: GalleryImageFrontmatter[] = []

		for (const sourcePath of sourceFiles) {
			try {
				if (GALLERY_RAW_EXTENSIONS.test(sourcePath)) {
					summary.unsupported++
					logger.warn(
						'RAW image requires manual conversion before Gallery sync',
						{
							sourcePath,
							supportedFormats: 'JPEG, PNG, TIFF, BMP, GIF, WebP, AVIF, HEIC',
						},
					)
					continue
				}
				const prepared = await prepareGalleryImage(sourcePath)
				const relativeWebp = `images/${prepared.file}`
				const sourcePathKey = `${inputAlbum.name}/${relativeWebp}`
				seenSourcePaths.add(sourcePathKey)
				const outputPath = path.join(albumDirectory, relativeWebp)
				const existing = configuredImages.get(prepared.file)
				const previous =
					existing && !dryRun
						? await galleryRepository.findExistingImage(sourcePathKey)
						: undefined
				const publicId = buildGalleryPublicId(slug, prepared.file)
				const unchanged =
					previous?.fileHash === prepared.hash &&
					previous.fileSize === prepared.size &&
					previous.publicId === publicId
				if (!dryRun) await fs.writeFile(outputPath, prepared.buffer)
				let upload =
					previous?.url && unchanged
						? {
								publicId: previous.publicId ?? '',
								url: previous.url,
								thumbnailUrl: previous.thumbnailUrl ?? previous.url,
							}
						: undefined
				if (!dryRun && !unchanged) {
					upload = await uploadGalleryWebp(prepared.buffer, publicId)
					summary.uploaded++
				} else if (unchanged) summary.skipped++
				if (!dryRun) {
					const galleryValues = {
						slug,
						title: config.data.title ?? inputAlbum.name,
						description: config.data.description || null,
						cover: config.data.cover || null,
						status:
							config.data.status === 'published'
								? ('PUBLISHED' as const)
								: config.data.status === 'archived'
									? ('ARCHIVED' as const)
									: ('DRAFT' as const),
						publishedAt: config.data.status === 'published' ? new Date() : null,
						sourcePath: `${inputAlbum.name}/album.yaml`,
						metadata: {
							tags: config.data.tags,
							location: config.data.location,
							showExif: config.data.showExif,
							showLocation: config.data.showLocation,
						},
					}
					const imageMetadata = {
						publicId: upload?.publicId || null,
						url: upload?.url || null,
						thumbnailUrl: upload?.thumbnailUrl || null,
						title: existing?.title || null,
						description: existing?.description || null,
						alt: existing?.alt || config.data.title,
						sortOrder: existing?.order ?? processedImages.length + 1,
						hidden: existing?.hidden ?? false,
						width: prepared.width,
						height: prepared.height,
						exif: prepared.exif,
						fileHash: prepared.hash,
						fileSize: prepared.size,
						sourceModifiedAt: prepared.mtime,
						lastSyncedAt: new Date(),
						syncStatus: 'IN_SYNC' as const,
						contentHash: prepared.hash,
					}
					await galleryRepository.upsertGalleryImage({
						galleryValues,
						galleryUpdateValues: {
							title: config.data.title,
							description: config.data.description || null,
							cover: config.data.cover || null,
							status: galleryValues.status,
							publishedAt: galleryValues.publishedAt,
							sourcePath: `${inputAlbum.name}/album.yaml`,
							metadata: galleryValues.metadata,
							contentHash: prepared.hash,
						},
						imageValues: { sourcePath: sourcePathKey, ...imageMetadata },
						imageUpdateValues: imageMetadata,
					})
				}
				processedImages.push({
					file: relativeWebp,
					title: existing?.title || '',
					description: existing?.description || '',
					alt: existing?.alt || '',
					order: existing?.order ?? processedImages.length + 1,
					hidden: existing?.hidden ?? false,
				})
				summary.images++
				summary.processed++
			} catch (error) {
				summary.errors++
				logger.error('Gallery image sync failed', error, {
					album: inputAlbum.name,
					sourcePath,
				})
			}
		}
		if (!dryRun)
			await fs.writeFile(
				config.configPath,
				stringify(
					{ ...config.data, images: processedImages },
					{ lineWidth: 120 },
				),
				'utf8',
			)
	}
	const metadataSlugs = await galleryRepository.syncAlbumOnlyMetadata(
		galleryRoot,
		new Set(seenSlugs),
		dryRun,
	)
	seenSlugs.push(...metadataSlugs)

	if (!dryRun) {
		summary.sourceMissing.push(
			...(await galleryRepository.findSourceMissing(
				seenSlugs,
				seenSourcePaths,
			)),
		)
	}

	if (!dryRun && options.deleteOld === true) {
		summary.archived += await galleryRepository.markRemovedSources({
			inputAlbumNames: inputAlbums.map((album) => album.name),
			seenSourcePaths,
			seenSlugs,
			galleryRoot,
		})
	}
	return summary
}

/** Temporary compatibility alias while the Sync orchestrator is migrated. */
export const syncGalleries = publishGallery
