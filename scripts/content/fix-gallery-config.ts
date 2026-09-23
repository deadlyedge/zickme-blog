import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { stringify } from 'yaml'
import {
	createAlbumSkeleton,
	GALLERY_ROOT,
	type ParsedGalleryAlbum,
	scanGalleryDirectory,
	writeGalleryIndex,
} from '../../src/lib/gallery/gallery-parser'

export type GalleryRepairResult = {
	albumName: string
	configPath: string
	changed: boolean
	generated: boolean
}

export async function fixGalleryAlbumConfig(
	album: ParsedGalleryAlbum,
	options: { dryRun: boolean; galleryRoot?: string },
): Promise<GalleryRepairResult> {
	const albumName = path.basename(album.directory)
	const configMissing = album.issues.includes('缺少 album.yaml')
	const imageFiles = album.files
	const skeleton = createAlbumSkeleton(albumName, imageFiles)
	const nextData = configMissing
		? { ...skeleton, images: skeleton.images ?? [] }
		: {
				...album.data,
				images: [
					...album.data.images,
					...imageFiles
						.filter(
							(file) =>
								!album.data.images.some(
									(image) => image.file === `images/${file}`,
								),
						)
						.map((file, index) => ({
							file: `images/${file}`,
							title: '',
							description: '',
							alt: '',
							order: album.data.images.length + index + 1,
							hidden: false,
						})),
				],
			}
	const changed =
		configMissing || nextData.images.length !== album.data.images.length

	if (changed && !options.dryRun)
		await fs.writeFile(
			album.configPath,
			stringify(nextData, { lineWidth: 120 }),
			'utf8',
		)

	return {
		albumName,
		configPath: album.configPath,
		changed,
		generated: configMissing,
	}
}

export async function fixGalleryIndex(options: {
	dryRun: boolean
	galleryRoot?: string
}): Promise<void> {
	if (options.dryRun) return
	const galleryRoot = options.galleryRoot ?? GALLERY_ROOT
	const refreshed = await scanGalleryDirectory(galleryRoot)
	await writeGalleryIndex(refreshed.albums, galleryRoot)
}
