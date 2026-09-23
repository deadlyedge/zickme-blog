import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
	listGalleryInputFiles,
	readGalleryAlbumConfig,
} from '../src/lib/publish/gallery-input-reader'
import {
	getPostImageRelativePath,
	PostMediaResolver,
	replaceMarkdownImages,
} from '../src/lib/publish/post-media-resolver'
import { hasPostSourcePathConflict } from '../src/lib/publish/post-repository'
import { generateSlug } from '../src/lib/slug'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory(prefix: string): Promise<string> {
	const directory = await mkdtemp(path.join(os.tmpdir(), prefix))
	temporaryDirectories.push(directory)
	return directory
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true })),
	)
})

describe('Post media resolver boundaries', () => {
	test('normalizes relative and nested image paths consistently', () => {
		expect(
			getPostImageRelativePath('guides/setup.md', './assets/cover.png'),
		).toBe('guides/assets/cover.png')
		expect(getPostImageRelativePath('intro.md', '/cover.png')).toBe('cover.png')
	})

	test('keeps external Markdown images unchanged and replaces requested sources', () => {
		const content =
			'![local](assets/image.png) and ![remote](https://example.com/image.png)'
		const result = replaceMarkdownImages(content, [
			{
				original: '![local](assets/image.png)',
				replaced: '![local](https://cdn.example.com/image.webp)',
			},
		])

		expect(result).toBe(
			'![local](https://cdn.example.com/image.webp) and ![remote](https://example.com/image.png)',
		)
	})

	test('dry-run preserves local image paths without reading or uploading them', async () => {
		let uploads = 0
		const resolver = new PostMediaResolver({
			dryRun: true,
			uploadBuffer: async () => {
				uploads++
				return 'https://cdn.example.com/image.webp'
			},
		})

		await expect(
			resolver.resolveAndUploadImage(
				'missing/image.png',
				'post.md',
				'post-slug',
				undefined,
				'Z:/path-that-does-not-exist',
			),
		).resolves.toBe('missing/image.png')
		expect(uploads).toBe(0)
	})

	test('resolves virtual images before filesystem fallback', async () => {
		const uploads: Array<{ buffer: Buffer; publicId: string }> = []
		const resolver = new PostMediaResolver({
			dryRun: false,
			uploadBuffer: async (buffer, publicId) => {
				uploads.push({ buffer, publicId })
				return 'https://cdn.example.com/virtual.webp'
			},
		})
		const imageBuffer = Buffer.from('virtual-image')
		const virtualImages = new Map([['guides/assets/cover.png', imageBuffer]])

		await expect(
			resolver.resolveAndUploadImage(
				'./assets/cover.png',
				'guides/post.md',
				'my-post',
				virtualImages,
			),
		).resolves.toBe('https://cdn.example.com/virtual.webp')
		expect(uploads).toHaveLength(1)
		expect(uploads[0]?.buffer).toBe(imageBuffer)
		expect(uploads[0]?.publicId).toBe('posts/my-post/cover')
	})

	test('falls back to a local file when a virtual image is unavailable', async () => {
		const postsDirectory = await createTemporaryDirectory('post-media-')
		const imageBuffer = Buffer.from('local-image')
		const imageDirectory = path.join(postsDirectory, 'guides', 'assets')
		await mkdir(imageDirectory, { recursive: true })
		await writeFile(path.join(imageDirectory, 'cover.png'), imageBuffer)
		const uploads: Array<{ buffer: Buffer; publicId: string }> = []
		const resolver = new PostMediaResolver({
			dryRun: false,
			uploadBuffer: async (buffer, publicId) => {
				uploads.push({ buffer, publicId })
				return 'https://cdn.example.com/local.webp'
			},
		})

		await expect(
			resolver.resolveAndUploadImage(
				'./assets/cover.png',
				'guides/post.md',
				'my-post',
				new Map(),
				postsDirectory,
			),
		).resolves.toBe('https://cdn.example.com/local.webp')
		expect(uploads).toHaveLength(1)
		expect(uploads[0]?.buffer).toEqual(imageBuffer)
		expect(uploads[0]?.publicId).toBe('posts/my-post/cover')
	})
})

describe('Post repository source protection', () => {
	test('rejects an existing slug that belongs to a different source file', () => {
		expect(hasPostSourcePathConflict('old/source.md', 'new/source.md')).toBe(
			true,
		)
		expect(hasPostSourcePathConflict('same/source.md', 'same/source.md')).toBe(
			false,
		)
		expect(hasPostSourcePathConflict(null, 'new/source.md')).toBe(false)
	})
})

describe('Gallery input reader boundaries', () => {
	test('lists supported files in natural case-insensitive order', async () => {
		const albumDirectory = await createTemporaryDirectory('gallery-input-')
		await Promise.all(
			['image10.JPG', 'image2.png', 'ignore.txt', 'nested'].map((name) =>
				name === 'nested'
					? mkdir(path.join(albumDirectory, name))
					: writeFile(path.join(albumDirectory, name), ''),
			),
		)

		expect(await listGalleryInputFiles(albumDirectory)).toEqual([
			path.join(albumDirectory, 'image2.png'),
			path.join(albumDirectory, 'image10.JPG'),
		])
	})

	test('reads album.yaml and falls back to the same skeleton when absent or malformed', async () => {
		const albumDirectory = await createTemporaryDirectory('gallery-config-')
		const files = ['photo1.webp', 'photo2.webp']
		const configPath = path.join(albumDirectory, 'album.yaml')

		const skeleton = await readGalleryAlbumConfig(albumDirectory, files)
		expect(skeleton.data.slug).toBe(generateSlug(path.basename(albumDirectory)))
		expect(skeleton.data.images.map((image) => image.file)).toEqual(
			files.map((file) => `images/${file}`),
		)

		await writeFile(configPath, 'title: Custom album\nstatus: published\n')
		const configured = await readGalleryAlbumConfig(albumDirectory, files)
		expect(configured.configPath).toBe(configPath)
		expect(configured.data.title).toBe('Custom album')
		expect(configured.data.status).toBe('published')

		await writeFile(configPath, 'title: [invalid')
		const malformed = await readGalleryAlbumConfig(albumDirectory, files)
		expect(malformed.data.title).toBe(path.basename(albumDirectory))
		expect(malformed.data.images.map((image) => image.file)).toEqual(
			files.map((file) => `images/${file}`),
		)
	})
})
