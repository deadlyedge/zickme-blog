import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { eq } from 'drizzle-orm'
import { stringify } from 'yaml'
import {
	GALLERY_INPUT_EXTENSIONS,
	GALLERY_RAW_EXTENSIONS,
} from '@/constants/media'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import {
	createAlbumSkeleton,
	GALLERY_ROOT,
	parseAlbumData,
	scanGalleryDirectory,
} from '@/lib/gallery/gallery-parser'
import { prepareGalleryImage } from '@/lib/gallery/media-preparation'
import { createLogger } from '@/lib/logger'
import {
	buildGalleryPublicId,
	uploadGalleryWebp,
} from '@/lib/media/gallery-media'
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

async function listInputFiles(albumDirectory: string): Promise<string[]> {
	const entries = await fs.readdir(albumDirectory, { withFileTypes: true })
	return entries
		.filter(
			(entry) =>
				entry.isFile() &&
				(GALLERY_INPUT_EXTENSIONS.test(entry.name) ||
					GALLERY_RAW_EXTENSIONS.test(entry.name)),
		)
		.sort((a, b) =>
			a.name.localeCompare(b.name, undefined, {
				numeric: true,
				sensitivity: 'base',
			}),
		)
		.map((entry) => path.join(albumDirectory, entry.name))
}

async function readExistingConfig(albumDirectory: string, files: string[]) {
	const configPath = path.join(albumDirectory, 'album.yaml')
	try {
		const raw = await fs.readFile(configPath, 'utf8')
		return {
			configPath,
			data: parseAlbumData((await import('yaml')).parse(raw), albumDirectory),
		}
	} catch {
		return {
			configPath,
			data: createAlbumSkeleton(path.basename(albumDirectory), files),
		}
	}
}

async function syncAlbumOnlyMetadata(
	galleryRoot: string,
	knownSlugs: Set<string>,
	dryRun: boolean,
): Promise<string[]> {
	if (dryRun) return []
	const scan = await scanGalleryDirectory(galleryRoot)
	const syncedSlugs: string[] = []
	for (const album of scan.albums) {
		const albumName = path.basename(album.directory)
		if (knownSlugs.has(album.data.slug) || album.issues.length > 0) continue
		const [gallery] = await db
			.select({ id: galleries.id })
			.from(galleries)
			.where(eq(galleries.slug, album.data.slug))
		if (!gallery) continue
		const status =
			album.data.status === 'published'
				? ('PUBLISHED' as const)
				: album.data.status === 'archived'
					? ('ARCHIVED' as const)
					: ('DRAFT' as const)
		await db
			.update(galleries)
			.set({
				title: album.data.title,
				description: album.data.description || null,
				cover: album.data.cover || null,
				status,
				publishedAt: status === 'PUBLISHED' ? new Date() : null,
				sourcePath: `${albumName}/album.yaml`,
				metadata: {
					tags: album.data.tags,
					location: album.data.location,
					showExif: album.data.showExif,
					showLocation: album.data.showLocation,
				},
			})
			.where(eq(galleries.id, gallery.id))
		for (const image of album.data.images ?? []) {
			await db
				.update(galleryImages)
				.set({
					title: image.title || null,
					description: image.description || null,
					alt: image.alt || album.data.title,
					sortOrder: image.order ?? 0,
					hidden: image.hidden ?? false,
				})
				.where(eq(galleryImages.sourcePath, `${albumName}/${image.file}`))
		}
		syncedSlugs.push(album.data.slug)
	}
	return syncedSlugs
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
		const sourceFiles = await listInputFiles(
			path.join(inputRoot, inputAlbum.name),
		)
		if (sourceFiles.length === 0) continue
		const albumDirectory = path.join(galleryRoot, inputAlbum.name)
		if (!dryRun)
			await fs.mkdir(path.join(albumDirectory, 'images'), { recursive: true })
		const config = await readExistingConfig(
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
						? await db.query.galleryImages.findFirst({
								where: eq(galleryImages.sourcePath, sourcePathKey),
							})
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
					const [gallery] = await db
						.insert(galleries)
						.values(galleryValues)
						.onConflictDoUpdate({
							target: galleries.slug,
							set: {
								title: config.data.title,
								description: config.data.description || null,
								cover: config.data.cover || null,
								status: galleryValues.status,
								publishedAt: galleryValues.publishedAt,
								sourcePath: `${inputAlbum.name}/album.yaml`,
								metadata: galleryValues.metadata,
								contentHash: prepared.hash,
							},
						})
						.returning({ id: galleries.id })
					await db
						.insert(galleryImages)
						.values({
							galleryId: gallery.id,
							sourcePath: sourcePathKey,
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
							syncStatus: 'IN_SYNC',
							contentHash: prepared.hash,
						})
						.onConflictDoUpdate({
							target: [galleryImages.galleryId, galleryImages.sourcePath],
							set: {
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
								syncStatus: 'IN_SYNC',
								contentHash: prepared.hash,
							},
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
	const metadataSlugs = await syncAlbumOnlyMetadata(
		galleryRoot,
		new Set(seenSlugs),
		dryRun,
	)
	seenSlugs.push(...metadataSlugs)

	if (!dryRun) {
		const persistedGalleries = await db.query.galleries.findMany({
			columns: { slug: true },
		})
		const persistedImages = await db.query.galleryImages.findMany({
			columns: { sourcePath: true },
		})
		const missingGalleries = persistedGalleries
			.map((gallery) => gallery.slug)
			.filter((slug) => !seenSlugs.includes(slug))
		const missingImages = persistedImages
			.map((image) => image.sourcePath)
			.filter((sourcePath) => !seenSourcePaths.has(sourcePath))
		summary.sourceMissing.push(...missingGalleries, ...missingImages)
	}

	if (!dryRun && options.deleteOld === true) {
		const persistedImages = await db.query.galleryImages.findMany({
			columns: { id: true, sourcePath: true },
		})
		for (const image of persistedImages) {
			const albumName = image.sourcePath.split('/')[0]
			if (!albumName || !inputAlbums.some((album) => album.name === albumName))
				continue
			if (seenSourcePaths.has(image.sourcePath)) continue
			await db
				.update(galleryImages)
				.set({ syncStatus: 'PENDING_DELETE' })
				.where(eq(galleryImages.id, image.id))
		}
		const local = await scanGalleryDirectory(galleryRoot)
		await Promise.all(
			local.albums
				.filter((album) => !seenSlugs.includes(album.data.slug))
				.map(async (album) => {
					await db
						.update(galleries)
						.set({ status: 'ARCHIVED' })
						.where(eq(galleries.slug, album.data.slug))
					summary.archived++
				}),
		)
	}
	return summary
}

/** Temporary compatibility alias while the Sync orchestrator is migrated. */
export const syncGalleries = publishGallery
