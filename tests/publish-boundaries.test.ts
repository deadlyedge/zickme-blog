import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { preparePostFrontmatter } from '../scripts/prepare-post-frontmatter'
import { parseSyncScope } from '../src/lib/sync/sync-types'

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
		expect(parseSyncScope('posts')).toBe('POSTS')
		expect(parseSyncScope('galleries')).toBe('GALLERIES')
		expect(parseSyncScope('all')).toBe('ALL')
		expect(() => parseSyncScope('remote')).toThrow()
	})
})
