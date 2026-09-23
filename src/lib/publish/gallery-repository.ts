import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import { scanGalleryDirectory } from '@/lib/gallery/gallery-parser'

export class GalleryRepository {
	async findExistingImage(sourcePath: string) {
		return db.query.galleryImages.findFirst({
			where: eq(galleryImages.sourcePath, sourcePath),
		})
	}

	async upsertGalleryImage(input: {
		galleryValues: typeof galleries.$inferInsert
		galleryUpdateValues: Partial<typeof galleries.$inferInsert>
		imageValues: Omit<typeof galleryImages.$inferInsert, 'galleryId'>
		imageUpdateValues: Partial<
			Omit<typeof galleryImages.$inferInsert, 'galleryId' | 'sourcePath'>
		>
	}): Promise<void> {
		const [gallery] = await db
			.insert(galleries)
			.values(input.galleryValues)
			.onConflictDoUpdate({
				target: galleries.slug,
				set: input.galleryUpdateValues,
			})
			.returning({ id: galleries.id })

		await db
			.insert(galleryImages)
			.values({ ...input.imageValues, galleryId: gallery.id })
			.onConflictDoUpdate({
				target: [galleryImages.galleryId, galleryImages.sourcePath],
				set: input.imageUpdateValues,
			})
	}

	async syncAlbumOnlyMetadata(
		galleryRoot: string,
		knownSlugs: Set<string>,
		dryRun: boolean,
	): Promise<string[]> {
		if (dryRun) return []
		const scan = await scanGalleryDirectory(galleryRoot)
		const syncedSlugs: string[] = []
		for (const album of scan.albums) {
			const albumName = album.directory.split(/[\\/]/).at(-1) ?? ''
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

	async findSourceMissing(
		seenSlugs: string[],
		seenSourcePaths: Set<string>,
	): Promise<string[]> {
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
		return [...missingGalleries, ...missingImages]
	}

	async markRemovedSources(input: {
		inputAlbumNames: string[]
		seenSourcePaths: Set<string>
		seenSlugs: string[]
		galleryRoot: string
	}): Promise<number> {
		const persistedImages = await db.query.galleryImages.findMany({
			columns: { id: true, sourcePath: true },
		})
		for (const image of persistedImages) {
			const albumName = image.sourcePath.split('/')[0]
			if (!albumName || !input.inputAlbumNames.includes(albumName)) continue
			if (input.seenSourcePaths.has(image.sourcePath)) continue
			await db
				.update(galleryImages)
				.set({ syncStatus: 'PENDING_DELETE' })
				.where(eq(galleryImages.id, image.id))
		}
		const local = await scanGalleryDirectory(input.galleryRoot)
		let archived = 0
		await Promise.all(
			local.albums
				.filter((album) => !input.seenSlugs.includes(album.data.slug))
				.map(async (album) => {
					await db
						.update(galleries)
						.set({ status: 'ARCHIVED' })
						.where(eq(galleries.slug, album.data.slug))
					archived++
				}),
		)
		return archived
	}
}

export const galleryRepository = new GalleryRepository()
