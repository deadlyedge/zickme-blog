import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { preparePostFrontmatter } from '../scripts/prepare-post-frontmatter'
import {
	type PublishSummary,
	publishSummaryFromSync,
} from '../src/lib/publish/publish-summary'
import {
	type PublishScope,
	parsePublishScope,
} from '../src/lib/publish/publish-types'

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
	})
})
