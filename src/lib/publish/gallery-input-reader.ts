import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { parse } from 'yaml'
import {
	GALLERY_INPUT_EXTENSIONS,
	GALLERY_RAW_EXTENSIONS,
} from '@/constants/media'
import {
	createAlbumSkeleton,
	type ParsedGalleryAlbum,
	parseAlbumData,
} from '@/lib/gallery/gallery-parser'
import type { GalleryAlbumFrontmatter } from '@/types/gallery'

export async function listGalleryInputFiles(
	albumDirectory: string,
): Promise<string[]> {
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

export async function readGalleryAlbumConfig(
	albumDirectory: string,
	files: string[],
): Promise<{
	configPath: string
	data: ParsedGalleryAlbum['data'] | GalleryAlbumFrontmatter
}> {
	const configPath = path.join(albumDirectory, 'album.yaml')
	try {
		const raw = await fs.readFile(configPath, 'utf8')
		return {
			configPath,
			data: parseAlbumData(parse(raw), albumDirectory),
		}
	} catch {
		return {
			configPath,
			data: createAlbumSkeleton(path.basename(albumDirectory), files),
		}
	}
}
