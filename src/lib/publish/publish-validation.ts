import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import {
	GALLERY_ROOT,
	scanGalleryDirectory,
} from '@/lib/gallery/gallery-parser'
import type {
	ContentIssue,
	PublishScope,
	ValidationReport,
} from '../../types/publish-types'

const POSTS_ROOT = path.join(process.cwd(), 'content/posts')
const GALLERY_INPUT_ROOT = path.join(process.cwd(), 'content/.gallery-input')
const REVIEW_FIELDS = ['title', 'slug', 'date', 'tags', 'status']
const PREPARABLE_IMAGE_PATTERN =
	/\.(jpe?g|png|tiff?|bmp|gif|webp|avif|heic|heif)$/i

async function walkMarkdown(root: string): Promise<string[]> {
	const files: string[] = []
	const entries = await fs
		.readdir(root, { withFileTypes: true })
		.catch(() => [])
	for (const entry of entries) {
		const file = path.join(root, entry.name)
		if (entry.isDirectory()) files.push(...(await walkMarkdown(file)))
		else if (entry.isFile() && entry.name.endsWith('.md')) files.push(file)
	}
	return files
}

async function walkInputFiles(root: string): Promise<string[]> {
	const files: string[] = []
	const entries = await fs
		.readdir(root, { withFileTypes: true })
		.catch(() => [])
	for (const entry of entries) {
		const file = path.join(root, entry.name)
		if (entry.isDirectory()) files.push(...(await walkInputFiles(file)))
		else if (entry.isFile() && PREPARABLE_IMAGE_PATTERN.test(entry.name))
			files.push(file)
	}
	return files
}

export function getExpectedWebpPath(
	sourcePath: string,
	galleryRoot = GALLERY_ROOT,
): string {
	const album = path.basename(path.dirname(sourcePath))
	const fileName = `${path.basename(sourcePath, path.extname(sourcePath))}.webp`
	return path.join(galleryRoot, album, 'images', fileName)
}

export async function getMediaPreparationIssue(
	sourcePath: string,
	galleryRoot = GALLERY_ROOT,
): Promise<'missing' | 'stale' | null> {
	const outputPath = getExpectedWebpPath(sourcePath, galleryRoot)
	const [sourceStat, outputStat] = await Promise.all([
		fs.stat(sourcePath),
		fs.stat(outputPath).catch(() => null),
	])
	if (!outputStat) return 'missing'
	if (sourceStat.mtimeMs > outputStat.mtimeMs) return 'stale'
	return null
}

function issue(
	value: Omit<ContentIssue, 'repairReviewMode'> & {
		repairReviewMode?: ContentIssue['repairReviewMode']
	},
): ContentIssue {
	return { repairReviewMode: 'none', ...value }
}

async function validatePosts(issues: ContentIssue[]): Promise<number> {
	const files = await walkMarkdown(POSTS_ROOT)
	const slugs = new Map<string, string[]>()
	for (const file of files) {
		const relative = path.relative(process.cwd(), file)
		try {
			const parsed = matter(await fs.readFile(file, 'utf8'))
			const data = parsed.data as Record<string, unknown>
			const missing = ['title', 'slug', 'date', 'status'].filter(
				(field) => data[field] === undefined || data[field] === '',
			)
			if (missing.length > 0) {
				issues.push(
					issue({
						scope: 'posts',
						code: 'FRONTMATTER_REBUILD_REQUIRED',
						filePath: relative,
						message: `缺少 Frontmatter 字段：${missing.join('、')}`,
						suggestedCommand: 'bun run content:check -- --scope posts --fix',
						canExecuteFromTui: true,
						requiresManualReview: true,
						repairReviewMode: 'inspect-generated-file',
						generatedPaths: [relative],
						reviewFields: REVIEW_FIELDS,
					}),
				)
			}
			const slug = typeof data.slug === 'string' ? data.slug.trim() : ''
			if (slug) slugs.set(slug, [...(slugs.get(slug) ?? []), relative])
		} catch (error) {
			issues.push(
				issue({
					scope: 'posts',
					code: 'CONTENT_INVALID',
					filePath: relative,
					message: `Markdown 解析失败：${error instanceof Error ? error.message : String(error)}`,
					canExecuteFromTui: false,
					requiresManualReview: true,
				}),
			)
		}
	}
	for (const [slug, sources] of slugs) {
		if (sources.length < 2) continue
		for (const filePath of sources)
			issues.push(
				issue({
					scope: 'posts',
					code: 'CONTENT_INVALID',
					filePath,
					message: `slug 冲突：${slug}`,
					field: 'slug',
					canExecuteFromTui: false,
					requiresManualReview: true,
				}),
			)
	}
	return files.length
}

async function validateGalleries(
	issues: ContentIssue[],
): Promise<{ albums: number; images: number }> {
	const scan = await scanGalleryDirectory(GALLERY_ROOT)
	for (const album of scan.albums) {
		const albumName = path.basename(album.directory)
		const albumPath = path.relative(process.cwd(), album.configPath)
		for (const message of album.issues) {
			const missingAlbum = message === '缺少 album.yaml'
			const rawMedia = message.startsWith('不允许的非 WebP 图片:')
			issues.push(
				issue({
					scope: 'galleries',
					code: missingAlbum
						? 'ALBUM_REBUILD_REQUIRED'
						: rawMedia
							? 'MEDIA_INVALID'
							: 'CONTENT_INVALID',
					filePath: albumPath,
					message: `${albumName}: ${message}`,
					suggestedCommand: missingAlbum
						? 'bun run content:check -- --scope galleries --fix --no-examples'
						: undefined,
					canExecuteFromTui: missingAlbum,
					requiresManualReview: missingAlbum || !rawMedia,
					repairReviewMode: missingAlbum ? 'inspect-generated-file' : 'none',
					generatedPaths: missingAlbum ? [albumPath] : undefined,
					reviewFields: missingAlbum
						? [
								'title',
								'description',
								'cover',
								'status',
								'images[].title',
								'images[].description',
								'images[].alt',
							]
						: undefined,
				}),
			)
		}
	}
	const indexPath = path.join(GALLERY_ROOT, 'gallery.yaml')
	const indexStat = await fs.stat(indexPath).catch(() => null)
	const latestAlbumMtime = await Promise.all(
		scan.albums.map(
			async (album) =>
				(await fs.stat(album.configPath).catch(() => ({ mtimeMs: 0 }))).mtimeMs,
		),
	)
	if (
		!indexStat ||
		latestAlbumMtime.some((mtime) => mtime > indexStat.mtimeMs)
	) {
		issues.push(
			issue({
				scope: 'galleries',
				code: 'GALLERY_INDEX_REQUIRED',
				filePath: path.relative(process.cwd(), indexPath),
				message: !indexStat ? 'gallery.yaml 缺失。' : 'gallery.yaml 已过期。',
				suggestedCommand: 'bun run gallery:index',
				canExecuteFromTui: true,
				requiresManualReview: true,
				repairReviewMode: 'review-git-diff',
				generatedPaths: [path.relative(process.cwd(), indexPath)],
			}),
		)
	}
	const inputFiles = await walkInputFiles(GALLERY_INPUT_ROOT)
	for (const file of inputFiles) {
		const preparationIssue = await getMediaPreparationIssue(file)
		if (!preparationIssue) continue
		const relative = path.relative(process.cwd(), file)
		const album = path.basename(path.dirname(file))
		const outputDirectory = path.relative(
			process.cwd(),
			path.dirname(getExpectedWebpPath(file)),
		)
		issues.push(
			issue({
				scope: 'galleries',
				code: 'MEDIA_PREPARATION_REQUIRED',
				filePath: relative,
				mediaPath: relative,
				message:
					preparationIssue === 'missing'
						? '原始图片尚未生成对应的 Git 管理 WebP。'
						: '原始图片比现有 WebP 更新，现有输出可能已经过期。',
				suggestedCommand: `bun run content:prepare-media -- --album ${album}`,
				canExecuteFromTui: true,
				requiresManualReview: true,
				repairReviewMode: 'inspect-generated-directory',
				generatedDirectories: [outputDirectory],
			}),
		)
	}
	return {
		albums: scan.albums.length,
		images: scan.albums.reduce((total, album) => total + album.files.length, 0),
	}
}

export async function validatePublishContent(
	scope: PublishScope,
): Promise<ValidationReport> {
	const issues: ContentIssue[] = []
	const checkedFiles = scope === 'galleries' ? 0 : await validatePosts(issues)
	const gallery =
		scope === 'posts'
			? { albums: 0, images: 0 }
			: await validateGalleries(issues)
	return {
		scope,
		valid: issues.length === 0,
		issues,
		warnings: [],
		checkedFiles,
		checkedAlbums: gallery.albums,
		checkedImages: gallery.images,
	}
}
