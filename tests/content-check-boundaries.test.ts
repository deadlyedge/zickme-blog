import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { checkContent, DEFAULT_CONFIG } from '../scripts/check-content'
import { checkGalleries } from '../scripts/content/check-galleries'
import { getPostSlugSourceMap } from '../scripts/content/check-posts'
import {
	fixGalleryAlbumConfig,
	fixGalleryIndex,
} from '../scripts/content/fix-gallery-config'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory(prefix: string): Promise<string> {
	const directory = await mkdtemp(path.join(os.tmpdir(), prefix))
	temporaryDirectories.push(directory)
	return directory
}

async function createPostFixture(
	directory: string,
	contents = '# Body text\n',
) {
	const filePath = path.join(directory, 'example.md')
	await writeFile(filePath, contents)
	return filePath
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true })),
	)
})

describe('content check and repair boundaries', () => {
	test('scope parsing preserves posts, galleries, all, and defaults to all', async () => {
		const { parseContentCliConfig } = await import('../scripts/check-content')
		expect(parseContentCliConfig([]).scope).toBe('all')
		expect(parseContentCliConfig([]).autoFix).toBe(false)
		expect(parseContentCliConfig([]).dryRun).toBe(false)
		expect(parseContentCliConfig(['--fix', '--check-only']).autoFix).toBe(false)
		expect(
			parseContentCliConfig(['--fix', '--dry-run', '--no-examples']).autoFix,
		).toBe(true)
		expect(
			parseContentCliConfig(['--fix', '--dry-run', '--no-examples']).dryRun,
		).toBe(true)
		expect(
			parseContentCliConfig(['--fix', '--dry-run', '--no-examples'])
				.showExamples,
		).toBe(false)
		expect(parseContentCliConfig(['--scope', 'posts']).scope).toBe('posts')
		expect(parseContentCliConfig(['--scope', 'galleries']).scope).toBe(
			'galleries',
		)
		expect(parseContentCliConfig(['--scope', 'all']).scope).toBe('all')
		expect(parseContentCliConfig(['--scope', 'invalid']).scope).toBe('all')
	})

	test('default content check is read-only even when required frontmatter is missing', async () => {
		const postsDir = await createTemporaryDirectory('content-check-readonly-')
		const filePath = await createPostFixture(postsDir)
		const before = await readFile(filePath, 'utf8')

		await checkContent({
			...DEFAULT_CONFIG,
			postsDir,
			scope: 'posts',
			showExamples: false,
		})

		expect(await readFile(filePath, 'utf8')).toBe(before)
	})

	test('dry-run repair mode reports without writing Markdown or Gallery files', async () => {
		const postsDir = await createTemporaryDirectory('content-check-dry-run-')
		const galleryRoot = await createTemporaryDirectory(
			'content-gallery-dry-run-',
		)
		const filePath = await createPostFixture(postsDir)
		const albumDirectory = path.join(galleryRoot, 'sample-album')
		await mkdir(path.join(albumDirectory, 'images'), { recursive: true })
		await writeFile(path.join(albumDirectory, 'images', 'one.webp'), '')
		const before = await readFile(filePath, 'utf8')

		await checkContent({
			...DEFAULT_CONFIG,
			postsDir,
			galleryRoot,
			scope: 'all',
			autoFix: true,
			dryRun: true,
			showExamples: false,
		})

		expect(await readFile(filePath, 'utf8')).toBe(before)
		expect(
			await readFile(path.join(albumDirectory, 'album.yaml')).catch(() => null),
		).toBe(null)
		expect(
			await readFile(path.join(galleryRoot, 'gallery.yaml')).catch(() => null),
		).toBe(null)
	})

	test('explicit Post repair adds frontmatter but preserves the Markdown body', async () => {
		const postsDir = await createTemporaryDirectory('content-check-post-fix-')
		const filePath = await createPostFixture(
			postsDir,
			'# Body heading\n\nBody text must stay exactly the same.\n',
		)

		await checkContent({
			...DEFAULT_CONFIG,
			postsDir,
			scope: 'posts',
			autoFix: true,
			dryRun: false,
			showExamples: false,
		})

		const repaired = await readFile(filePath, 'utf8')
		expect(repaired).toContain('title: Example')
		expect(repaired).toContain('slug: example')
		expect(repaired).toContain(
			'# Body heading\n\nBody text must stay exactly the same.',
		)
	})

	test('Gallery scope preserves legacy Post checks and additionally scans Gallery', async () => {
		const fixtureRoot = await createTemporaryDirectory('content-gallery-scope-')
		const galleryRoot = path.join(fixtureRoot, 'galleries')
		const postsDir = path.join(fixtureRoot, 'posts')
		await mkdir(galleryRoot, { recursive: true })
		await mkdir(postsDir, { recursive: true })
		const postFile = await createPostFixture(postsDir)
		const originalPost = await readFile(postFile, 'utf8')
		const albumDirectory = path.join(galleryRoot, 'album')
		await mkdir(path.join(albumDirectory, 'images'), { recursive: true })
		await writeFile(path.join(albumDirectory, 'images', 'photo.webp'), '')

		await checkContent({
			...DEFAULT_CONFIG,
			postsDir,
			galleryRoot,
			scope: 'galleries',
			showExamples: false,
		})

		expect(await readFile(postFile, 'utf8')).toBe(originalPost)
		await expect(checkGalleries(galleryRoot)).resolves.toMatchObject({
			albums: [{ data: { title: 'album' } }],
		})
	})

	test('duplicate slug detection uses explicit frontmatter slugs', async () => {
		const postsDir = await createTemporaryDirectory('content-slug-conflicts-')
		const firstPath = path.join(postsDir, 'first.md')
		const secondPath = path.join(postsDir, 'second.md')
		await writeFile(firstPath, '---\nslug: shared\n---\nfirst')
		await writeFile(secondPath, '---\nslug: shared\n---\nsecond')

		const slugSources = await getPostSlugSourceMap(
			[firstPath, secondPath],
			postsDir,
		)
		expect(slugSources.get('shared')).toEqual(['first.md', 'second.md'])
	})

	test('Gallery repair writes only when explicitly called and preserves authored fields', async () => {
		const galleryRoot = await createTemporaryDirectory('content-gallery-fix-')
		const albumDirectory = path.join(galleryRoot, 'travel')
		const imagesDirectory = path.join(albumDirectory, 'images')
		await mkdir(imagesDirectory, { recursive: true })
		await writeFile(path.join(imagesDirectory, 'photo.webp'), '')

		const scan = await checkGalleries(galleryRoot)
		const album = scan.albums[0]
		expect(album).toBeDefined()
		if (!album) throw new Error('Expected fixture album')

		const preview = await fixGalleryAlbumConfig(album, {
			dryRun: true,
			galleryRoot,
		})
		const albumConfigPath = path.join(albumDirectory, 'album.yaml')
		expect(preview.changed).toBe(true)
		expect(await readFile(albumConfigPath).catch(() => null)).toBeNull()

		await fixGalleryAlbumConfig(album, { dryRun: false, galleryRoot })
		const config = await readFile(albumConfigPath, 'utf8')
		expect(config).toContain('title: travel')
		expect(config).toContain('file: images/photo.webp')
		expect(
			await readFile(path.join(galleryRoot, 'gallery.yaml')).catch(() => null),
		).toBe(null)

		await fixGalleryIndex({ dryRun: true, galleryRoot })
		expect(
			await readFile(path.join(galleryRoot, 'gallery.yaml')).catch(() => null),
		).toBe(null)
		await fixGalleryIndex({ dryRun: false, galleryRoot })
		expect(
			await readFile(path.join(galleryRoot, 'gallery.yaml'), 'utf8'),
		).toContain('albums:')
	})

	test('Gallery repair only adds missing image entries to existing authored config', async () => {
		const galleryRoot = await createTemporaryDirectory('content-gallery-merge-')
		const albumDirectory = path.join(galleryRoot, 'authored-album')
		const imagesDirectory = path.join(albumDirectory, 'images')
		await mkdir(imagesDirectory, { recursive: true })
		await writeFile(path.join(imagesDirectory, 'one.webp'), '')
		await writeFile(path.join(imagesDirectory, 'two.webp'), '')
		const albumConfig = path.join(albumDirectory, 'album.yaml')
		await writeFile(
			albumConfig,
			'title: Hand-written title\nslug: authored-album\nstatus: published\nimages:\n  - file: images/one.webp\n    title: Existing title\n    order: 4\n',
		)

		const scan = await checkGalleries(galleryRoot)
		const album = scan.albums[0]
		expect(album).toBeDefined()
		if (!album) throw new Error('Expected fixture album')
		await fixGalleryAlbumConfig(album, { dryRun: false, galleryRoot })

		const repairedConfig = await readFile(albumConfig, 'utf8')
		expect(repairedConfig).toContain('title: Hand-written title')
		expect(repairedConfig).toContain('title: Existing title')
		expect(repairedConfig).toContain('file: images/two.webp')
	})
})
