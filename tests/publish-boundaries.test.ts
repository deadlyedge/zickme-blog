import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { preparePostFrontmatter } from '../scripts/prepare-post-frontmatter'
import { legacySyncResultFromPublish } from '../src/lib/publish/publish-legacy'
import {
	type PublishSummary,
	publishSummaryFromSync,
} from '../src/lib/publish/publish-summary'
import {
	type PublishScope,
	parsePublishScope,
} from '../src/lib/publish/publish-types'
import { resolvePublishDeleteOld } from '../src/lib/publish/publish-workflow'

const fixtureRoot = path.join(process.cwd(), '.tmp-publish-boundaries')
const fixture = path.join(fixtureRoot, 'draft.md')

describe('publish boundaries', () => {
	beforeAll(async () => {
		await mkdir(fixtureRoot, { recursive: true })
		await writeFile(fixture, '# Temporary post\n\nBody must stay unchanged.\n')
	})

	afterAll(async () => {
		await rm(fixtureRoot, { recursive: true, force: true })
	})

	test('dry-run frontmatter preparation does not write the workspace', async () => {
		const before = await readFile(fixture, 'utf8')
		const result = await preparePostFrontmatter(fixtureRoot, true)
		expect(result.checked).toBe(1)
		expect(result.missingFrontmatter).toHaveLength(1)
		expect(await readFile(fixture, 'utf8')).toBe(before)
	})

	test('publish preparation adds metadata without changing the body', async () => {
		await preparePostFrontmatter(fixtureRoot, false)
		const content = await readFile(fixture, 'utf8')
		expect(content).toContain('title: Draft')
		expect(content).toContain('slug: draft')
		expect(content).toContain('# Temporary post')
		expect(content).toContain('Body must stay unchanged.')
	})

	test('only the supported publish scopes are accepted', () => {
		expect(parsePublishScope('posts')).toBe('posts')
		expect(parsePublishScope('galleries')).toBe('galleries')
		expect(parsePublishScope('all')).toBe('all')
		expect(() => parsePublishScope('remote')).toThrow()
	})

	test('publish summary does not expose Sync-only protocol fields', () => {
		const syncSummary = {
			runId: 'run-1',
			scope: 'POSTS' as const,
			status: 'SUCCEEDED' as const,
			dryRun: true,
			triggeredBy: 'CLI' as const,
			startedAt: '2026-09-14T00:00:00.000Z',
			finishedAt: '2026-09-14T00:00:01.000Z',
			posts: {
				total: 1,
				processed: 1,
				succeeded: 1,
				errors: 0,
				mediaErrors: 0,
				archived: 0,
				sourceMissing: ['old-post'],
			},
			galleries: {
				albums: 0,
				images: 0,
				processed: 0,
				uploaded: 0,
				skipped: 0,
				unsupported: 0,
				archived: 0,
				pendingDelete: 0,
				conflicts: 0,
				errors: 0,
				sourceMissing: ['travel/missing.webp'],
			},
			conflicts: 0,
			errors: 0,
			retryOf: 'legacy-run',
		}
		const publishSummary: PublishSummary = publishSummaryFromSync(syncSummary)
		const serialized = JSON.stringify(publishSummary)

		expect(publishSummary.scope satisfies PublishScope).toBe('posts')
		expect(serialized).not.toContain('retryOf')
		expect(serialized).not.toContain('mergeBase')
		expect(serialized).not.toContain('revision')
		expect(publishSummary.posts.sourceMissing).toEqual(['old-post'])
		expect(publishSummary.galleries.sourceMissing).toEqual([
			'travel/missing.webp',
		])
	})

	test('legacy Dashboard result is adapted from Publish summary', () => {
		const summary = publishSummaryFromSync({
			runId: 'run-2',
			scope: 'POSTS',
			status: 'PARTIAL_SUCCESS',
			dryRun: true,
			triggeredBy: 'DASHBOARD',
			startedAt: '2026-09-14T00:00:00.000Z',
			finishedAt: '2026-09-14T00:00:01.000Z',
			posts: {
				total: 2,
				processed: 2,
				succeeded: 1,
				errors: 1,
				mediaErrors: 0,
				archived: 0,
				sourceMissing: ['old-post'],
			},
			galleries: {
				albums: 0,
				images: 0,
				processed: 0,
				uploaded: 0,
				skipped: 0,
				unsupported: 0,
				archived: 0,
				pendingDelete: 0,
				conflicts: 0,
				errors: 0,
				sourceMissing: ['travel/missing.webp'],
			},
			conflicts: 0,
			errors: 1,
		})
		const result = legacySyncResultFromPublish(summary)

		expect(result.status).toBe('PARTIAL')
		expect(result.totalPosts).toBe(2)
		expect(result.successCount).toBe(1)
		expect(result.errorCount).toBe(1)
		expect(result.logs[0]?.message).toContain('发布运行 run-2')
		expect(result.sourceMissing).toEqual(['old-post', 'travel/missing.webp'])
	})

	test('publish never enables destructive source-missing cleanup', () => {
		expect(resolvePublishDeleteOld()).toBe(false)
		expect(resolvePublishDeleteOld(false)).toBe(false)
		expect(resolvePublishDeleteOld(true)).toBe(false)
	})
})
