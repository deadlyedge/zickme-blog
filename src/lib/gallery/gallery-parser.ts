import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { parse, stringify } from 'yaml'
import { generateSlug } from '@/lib/slug'
import type {
	GalleryAlbumFrontmatter,
	GalleryImageFrontmatter,
	GalleryIndexEntry,
	GalleryLayout,
	GallerySort,
} from '@/types/gallery'

export const GALLERY_ROOT = path.join(process.cwd(), 'content/photo-gallery')
const WEBP_PATTERN = /^.+\.webp$/i
const ALBUM_STATUSES = new Set(['published', 'draft', 'archived'])
const LAYOUTS = new Set<GalleryLayout>(['masonry', 'grid', 'justified'])
const SORTS = new Set<GallerySort>(['filename', 'mtime', 'manual'])

export interface ParsedGalleryAlbum {
	directory: string
	configPath: string
	data: Required<
		Pick<
			GalleryAlbumFrontmatter,
			'slug' | 'title' | 'status' | 'layout' | 'sort'
		>
	> &
		GalleryAlbumFrontmatter & { images: GalleryImageFrontmatter[] }
	files: string[]
	issues: string[]
}

export interface GalleryScanResult {
	albums: ParsedGalleryAlbum[]
	issues: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateRelativePath(value: string, label: string): string | null {
	const normalized = value.replaceAll('\\', '/')
	if (
		!normalized ||
		path.posix.isAbsolute(normalized) ||
		normalized.startsWith('../')
	) {
		return `${label} 必须是相册目录内的相对路径`
	}
	const segments = normalized.split('/')
	if (segments.includes('..') || segments.includes('.')) {
		return `${label} 不允许包含 . 或 .. 路径段`
	}
	return null
}

function normalizeImage(
	value: unknown,
	index: number,
): GalleryImageFrontmatter | null {
	if (!isRecord(value) || typeof value.file !== 'string' || !value.file.trim())
		return null
	const image: GalleryImageFrontmatter = {
		file: value.file.trim().replaceAll('\\', '/'),
		title: typeof value.title === 'string' ? value.title : '',
		description: typeof value.description === 'string' ? value.description : '',
		alt: typeof value.alt === 'string' ? value.alt : '',
		order:
			typeof value.order === 'number' && Number.isInteger(value.order)
				? value.order
				: index + 1,
		hidden: value.hidden === true,
	}
	return image
}

export function parseAlbumData(
	raw: unknown,
	albumDirectory: string,
): ParsedGalleryAlbum['data'] {
	if (!isRecord(raw)) throw new Error('album.yaml 必须解析为对象')
	const directoryName = path.basename(albumDirectory)
	const slug =
		typeof raw.slug === 'string' && raw.slug.trim()
			? raw.slug.trim()
			: generateSlug(directoryName)
	const title =
		typeof raw.title === 'string' && raw.title.trim()
			? raw.title.trim()
			: directoryName
	const status =
		typeof raw.status === 'string' && ALBUM_STATUSES.has(raw.status)
			? raw.status
			: 'draft'
	const layout =
		typeof raw.layout === 'string' && LAYOUTS.has(raw.layout as GalleryLayout)
			? (raw.layout as GalleryLayout)
			: 'masonry'
	const sort =
		typeof raw.sort === 'string' && SORTS.has(raw.sort as GallerySort)
			? (raw.sort as GallerySort)
			: 'filename'
	const images = Array.isArray(raw.images)
		? raw.images
				.map(normalizeImage)
				.filter((image): image is GalleryImageFrontmatter => image !== null)
		: []

	return {
		slug,
		title,
		description: typeof raw.description === 'string' ? raw.description : '',
		date: typeof raw.date === 'string' ? raw.date : undefined,
		status: status as NonNullable<GalleryAlbumFrontmatter['status']>,
		cover: typeof raw.cover === 'string' ? raw.cover : '',
		tags: Array.isArray(raw.tags)
			? raw.tags.filter((tag): tag is string => typeof tag === 'string')
			: [],
		location: typeof raw.location === 'string' ? raw.location : '',
		layout,
		sort,
		showExif: raw.showExif === true,
		showLocation: raw.showLocation === true,
		images,
	}
}

export function sortGalleryFiles(
	files: Array<{ name: string; mtimeMs: number }>,
	sort: GallerySort,
): string[] {
	return [...files]
		.sort((a, b) => {
			if (sort === 'mtime' && a.mtimeMs !== b.mtimeMs)
				return a.mtimeMs - b.mtimeMs
			return a.name.localeCompare(b.name, undefined, {
				numeric: true,
				sensitivity: 'base',
			})
		})
		.map((file) => file.name)
}

export async function scanGalleryDirectory(
	root = GALLERY_ROOT,
): Promise<GalleryScanResult> {
	const albums: ParsedGalleryAlbum[] = []
	const issues: string[] = []
	let entries: import('node:fs').Dirent[]
	try {
		entries = await fs.readdir(root, { withFileTypes: true })
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT')
			return { albums, issues }
		throw error
	}

	for (const entry of entries
		.filter((item) => item.isDirectory())
		.sort((a, b) => a.name.localeCompare(b.name))) {
		const directory = path.join(root, entry.name)
		const configPath = path.join(directory, 'album.yaml')
		const imagesDirectory = path.join(directory, 'images')
		const albumIssues: string[] = []
		let data: ParsedGalleryAlbum['data']
		try {
			data = parseAlbumData(
				await parse(await fs.readFile(configPath, 'utf8')),
				directory,
			)
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				data = parseAlbumData({}, directory)
				albumIssues.push('缺少 album.yaml')
			} else {
				albumIssues.push(
					`album.yaml 解析失败: ${error instanceof Error ? error.message : String(error)}`,
				)
				continue
			}
		}

		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug))
			albumIssues.push(`slug 无效: ${data.slug}`)
		const imageEntries = await fs
			.readdir(imagesDirectory, { withFileTypes: true })
			.catch(() => [])
		const albumRootFiles = (
			await fs.readdir(directory, { withFileTypes: true })
		).filter(
			(item) =>
				item.isFile() &&
				item.name !== 'album.yaml' &&
				item.name !== 'gallery.yaml',
		)
		for (const file of albumRootFiles)
			albumIssues.push(`图片必须放在 images/ 目录且必须是 WebP: ${file.name}`)
		const imageStats = await Promise.all(
			imageEntries
				.filter((item) => item.isFile())
				.map(async (item) => ({
					name: item.name,
					mtimeMs: (await fs.stat(path.join(imagesDirectory, item.name)))
						.mtimeMs,
				})),
		)
		const rawFiles = imageEntries
			.filter((item) => item.isFile() && !WEBP_PATTERN.test(item.name))
			.map((item) => item.name)
		for (const file of rawFiles)
			albumIssues.push(`不允许的非 WebP 图片: images/${file}`)
		const files = sortGalleryFiles(
			imageStats.filter((file) => WEBP_PATTERN.test(file.name)),
			data.sort,
		)
		const registered = new Set(data.images.map((image) => image.file))
		for (const file of files)
			if (!registered.has(`images/${file}`))
				albumIssues.push(`图片未登记: images/${file}`)
		for (const image of data.images) {
			const pathIssue = validateRelativePath(
				image.file,
				`图片路径 ${image.file}`,
			)
			if (pathIssue) albumIssues.push(pathIssue)
			if (!WEBP_PATTERN.test(image.file))
				albumIssues.push(`图片必须为 WebP: ${image.file}`)
			if (!files.includes(path.posix.basename(image.file)))
				albumIssues.push(`配置图片不存在: ${image.file}`)
		}
		if (data.cover) {
			const coverIssue = validateRelativePath(data.cover, 'cover')
			if (coverIssue) albumIssues.push(coverIssue)
			else if (!files.includes(path.posix.basename(data.cover)))
				albumIssues.push(`封面图片不存在: ${data.cover}`)
		}
		const orders = data.images
			.map((image) => image.order)
			.filter((order): order is number => order !== undefined)
		if (new Set(orders).size !== orders.length)
			albumIssues.push('图片 order 存在重复')
		albums.push({ directory, configPath, data, files, issues: albumIssues })
		issues.push(...albumIssues.map((issue) => `${entry.name}: ${issue}`))
	}
	const slugs = new Set<string>()
	for (const album of albums) {
		if (slugs.has(album.data.slug))
			issues.push(`相册 slug 冲突: ${album.data.slug}`)
		slugs.add(album.data.slug)
	}
	return { albums, issues }
}

export function createAlbumSkeleton(
	albumName: string,
	files: string[],
): GalleryAlbumFrontmatter {
	const slug = generateSlug(albumName)
	return {
		slug,
		title: albumName,
		description: '',
		date: undefined,
		status: 'draft',
		cover: files.length > 0 ? `images/${files[0]}` : '',
		tags: [],
		location: '',
		layout: 'masonry',
		sort: 'filename',
		showExif: false,
		showLocation: false,
		images: files.map((file, index) => ({
			file: `images/${file}`,
			title: '',
			description: '',
			alt: '',
			order: index + 1,
			hidden: false,
		})),
	}
}

export async function writeGalleryIndex(
	albums: ParsedGalleryAlbum[],
	root = GALLERY_ROOT,
): Promise<void> {
	const entries: GalleryIndexEntry[] = []
	for (const album of albums) {
		const stats = await fs
			.stat(album.configPath)
			.catch(() => ({ mtime: new Date(0) }))
		entries.push({
			slug: album.data.slug,
			title: album.data.title,
			description: album.data.description ?? '',
			path: `${path.basename(album.directory)}/album.yaml`,
			cover: album.data.cover
				? `${path.basename(album.directory)}/${album.data.cover}`
				: null,
			imageCount: album.files.length,
			status: album.data.status ?? 'draft',
			updatedAt: stats.mtime.toISOString(),
		})
	}
	await fs.mkdir(root, { recursive: true })
	await fs.writeFile(
		path.join(root, 'gallery.yaml'),
		stringify(
			{ generatedAt: new Date().toISOString(), albums: entries },
			{ lineWidth: 120 },
		),
		'utf8',
	)
}

export { stringify, validateRelativePath }
