import { describe, expect, test } from 'bun:test'
import { mkdir, rm, utimes, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { repairCommand } from '../src/lib/publish/publish-repair'
import {
	getExpectedWebpPath,
	getMediaPreparationIssue,
} from '../src/lib/publish/publish-validation'
import { parsePublishScope } from '../src/types/publish-types'

const mediaFixtureRoot = path.join(
	process.cwd(),
	'.tmp-publish-assistant-media',
)

describe('publish assistant', () => {
	test('accepts only the supported lowercase scopes', () => {
		expect(parsePublishScope(undefined)).toBe('all')
		expect(parsePublishScope('posts')).toBe('posts')
		expect(parsePublishScope('GALLERIES')).toBe('galleries')
		expect(() => parsePublishScope('remote')).toThrow()
	})

	test('uses fixed repair commands', () => {
		expect(
			repairCommand({
				scope: 'posts',
				code: 'FRONTMATTER_REBUILD_REQUIRED',
				filePath: 'content/posts/example.md',
				message: 'missing',
				canExecuteFromTui: true,
				requiresManualReview: true,
				repairReviewMode: 'inspect-generated-file',
			}),
		).toEqual([
			'run',
			'scripts/check-content.ts',
			'--scope',
			'posts',
			'--fix',
			'--no-examples',
		])
		expect(
			repairCommand({
				scope: 'galleries',
				code: 'ALBUM_REBUILD_REQUIRED',
				filePath: 'content/photo-gallery/example/album.yaml',
				message: 'missing',
				canExecuteFromTui: true,
				requiresManualReview: true,
				repairReviewMode: 'inspect-generated-file',
			}),
		).toEqual([
			'run',
			'scripts/check-content.ts',
			'--scope',
			'galleries',
			'--fix',
			'--no-examples',
		])
	})

	test('does not report an input image when its WebP is current', async () => {
		const source = path.join(mediaFixtureRoot, 'travel', 'photo.jpg')
		const output = getExpectedWebpPath(source, mediaFixtureRoot)
		await mkdir(path.dirname(source), { recursive: true })
		await mkdir(path.dirname(output), { recursive: true })
		await writeFile(source, 'source')
		await writeFile(output, 'webp')
		await utimes(source, 100, 100)
		await utimes(output, 200, 200)

		expect(await getMediaPreparationIssue(source, mediaFixtureRoot)).toBeNull()
		await rm(mediaFixtureRoot, { recursive: true, force: true })
	})

	test('reports missing and stale WebP outputs', async () => {
		const source = path.join(mediaFixtureRoot, 'travel', 'photo.jpg')
		const output = getExpectedWebpPath(source, mediaFixtureRoot)
		await mkdir(path.dirname(source), { recursive: true })
		await writeFile(source, 'source')
		expect(await getMediaPreparationIssue(source, mediaFixtureRoot)).toBe(
			'missing',
		)

		await mkdir(path.dirname(output), { recursive: true })
		await writeFile(output, 'webp')
		await utimes(output, 100, 100)
		await utimes(source, 200, 200)
		expect(await getMediaPreparationIssue(source, mediaFixtureRoot)).toBe(
			'stale',
		)
		await rm(mediaFixtureRoot, { recursive: true, force: true })
	})
})
