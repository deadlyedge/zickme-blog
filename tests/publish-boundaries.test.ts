import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { checkContent, DEFAULT_CONFIG } from '../scripts/check-content'
import { PUBLISH_SCOPES, PUBLISH_STATUSES } from '../src/lib/constants/publish'
import {
	type PublishScope,
	parsePublishScope,
} from '../src/lib/publish/publish-types'
import { resolvePublishDeleteOld } from '../src/lib/publish/publish-workflow'
import type { PublishSummary as RootPublishSummary } from '../src/types'

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
		await checkContent({
			...DEFAULT_CONFIG,
			postsDir: fixtureRoot,
			scope: 'posts',
			dryRun: true,
			autoFix: false,
			showExamples: false,
		})
		expect(await readFile(fixture, 'utf8')).toBe(before)
	})

	test('publish preparation adds metadata without changing the body', async () => {
		await checkContent({
			...DEFAULT_CONFIG,
			postsDir: fixtureRoot,
			scope: 'posts',
			dryRun: false,
			autoFix: true,
			showExamples: false,
		})
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

	test('root types keep PublishSummary as a compatibility export', () => {
		const summary: RootPublishSummary = {
			runId: 'root-export',
			scope: 'posts',
			status: 'SUCCEEDED',
			dryRun: true,
			triggeredBy: 'CLI',
			startedAt: '2026-09-14T00:00:00.000Z',
			finishedAt: null,
			posts: {
				total: 0,
				processed: 0,
				succeeded: 0,
				errors: 0,
				mediaErrors: 0,
				archived: 0,
				sourceMissing: [],
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
				sourceMissing: [],
			},
			conflicts: 0,
			errors: 0,
		}

		expect(summary.scope).toBe('posts')
	})

	test('publish constants remain centralized and stable', () => {
		expect(PUBLISH_SCOPES).toEqual(['posts', 'galleries', 'all'])
		expect(PUBLISH_STATUSES).toContain('SUCCEEDED')
	})

	test('PublishSummary does not expose Sync-only protocol fields', () => {
		const publishSummary: RootPublishSummary = {
			runId: 'run-1',
			scope: 'posts',
			status: 'SUCCEEDED',
			dryRun: true,
			triggeredBy: 'CLI',
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
		}
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

	test('publish never enables destructive source-missing cleanup', () => {
		expect(resolvePublishDeleteOld()).toBe(false)
		expect(resolvePublishDeleteOld(false)).toBe(false)
		expect(resolvePublishDeleteOld(true)).toBe(false)
	})
})
