import { afterAll, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { stringify } from 'yaml'
import { toSiteFilesForExport } from '../src/lib/publish/site-export'
import {
	getSitePublishValues,
	readSiteFiles,
	validatePinnedPostSlugs,
} from '../src/lib/publish/site-input-reader'
import { publishSite } from '../src/lib/publish/site-publish-service'
import {
	SITE_FILE_NAMES,
	siteFileSchemaByName,
	siteLandingFileSchema,
	siteProfileFileSchema,
	siteThemeFileSchema,
} from '../src/lib/publish/site-schema'
import type { SiteProfile } from '../src/types/site'

const temporaryRoots: string[] = []

async function createSiteFixture(): Promise<string> {
	const root = await mkdtemp(path.join(os.tmpdir(), 'site-publish-'))
	temporaryRoots.push(root)
	const siteRoot = path.join(root, 'site')
	await mkdir(siteRoot, { recursive: true })
	const files = [
		{
			name: 'profile.yaml',
			value: {
				name: 'Example',
				title: 'Engineer',
				bio: '',
				socialLinks: [],
				skills: [],
				about: {},
			},
		},
		{ name: 'theme.yaml', value: {} },
		{
			name: 'landing.yaml',
			value: { pinnedPostSlugs: [], slogans: [] },
		},
	]
	for (const file of files)
		await writeFile(
			path.join(siteRoot, file.name),
			stringify(file.value),
			'utf8',
		)
	return siteRoot
}

async function replaceSiteYaml(
	siteRoot: string,
	fileName: (typeof SITE_FILE_NAMES)[number],
	value: unknown,
) {
	await writeFile(path.join(siteRoot, fileName), stringify(value), 'utf8')
}

describe('Site content publish', () => {
	test('requires every declared site YAML file', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'site-missing-'))
		temporaryRoots.push(root)
		await expect(readSiteFiles(root)).rejects.toThrow('.yaml')
	})

	test('validates strict YAML schemas and rejects unsafe URLs and CSS injection', async () => {
		expect(
			siteProfileFileSchema.safeParse({
				name: 'Example',
				title: '',
				bio: '',
				typo: true,
			}).success,
		).toBe(false)
		expect(
			siteProfileFileSchema.safeParse({
				name: 'Example',
				title: '',
				bio: '',
				website: 'javascript:alert(1)',
			}).success,
		).toBe(false)
		expect(
			siteThemeFileSchema.safeParse({ customCss: '</style><script>' }).success,
		).toBe(false)
		expect(
			siteThemeFileSchema.safeParse({ light: { '--primary': '</style>' } })
				.success,
		).toBe(false)
		expect(
			siteLandingFileSchema.safeParse({
				pinnedPostSlugs: ['same', 'same'],
			}).success,
		).toBe(false)
	})

	test('site dry-run reads and validates files without DB or Cloudinary writes', async () => {
		const siteRoot = await createSiteFixture()
		const summary = await publishSite({ dryRun: true, siteRoot })
		expect(summary).toEqual({
			profiles: 1,
			portraitUploaded: 0,
			pinnedPosts: 0,
			errors: 0,
		})
	})

	test('publishes merged profile and landing YAML sections to their runtime fields', async () => {
		const siteRoot = await createSiteFixture()
		await replaceSiteYaml(siteRoot, 'profile.yaml', {
			name: 'Example',
			title: 'Engineer',
			bio: '',
			socialLinks: [{ platform: 'GitHub', url: 'https://github.com/example' }],
			skills: [
				{ category: 'Engineering', technologies: [{ name: 'TypeScript' }] },
			],
			about: { headline: 'About me', educationTimeline: [] },
		})
		await replaceSiteYaml(siteRoot, 'landing.yaml', {
			showSlogans: true,
			slogans: [{ text: 'Build carefully' }],
		})
		const files = await readSiteFiles(siteRoot)
		const values = getSitePublishValues(files, null, [])

		expect(values.socialLinks).toEqual([
			{ platform: 'GitHub', url: 'https://github.com/example' },
		])
		expect(values.skills).toEqual([
			{ category: 'Engineering', technologies: [{ name: 'TypeScript' }] },
		])
		expect(values.aboutPageConfig).toEqual({
			headline: 'About me',
			educationTimeline: [],
		})
		expect(values.slogans).toEqual([{ text: 'Build carefully' }])
		expect(values.landingPageConfig).toMatchObject({
			showSlogans: true,
			pinnedPostIds: [],
		})
	})

	test('validates pinnedPostSlugs against local Markdown slugs', async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'site-pinned-'))
		temporaryRoots.push(root)
		const siteRoot = path.join(root, 'site')
		const postsRoot = path.join(root, 'posts')
		await mkdir(siteRoot, { recursive: true })
		await mkdir(postsRoot, { recursive: true })
		for (const fileName of SITE_FILE_NAMES) {
			const value =
				fileName === 'profile.yaml'
					? {
							name: 'Example',
							title: '',
							bio: '',
							socialLinks: [],
							skills: [],
							about: {},
						}
					: fileName === 'landing.yaml'
						? { pinnedPostSlugs: ['existing', 'missing'], slogans: [] }
						: {}
			await replaceSiteYaml(siteRoot, fileName, value)
		}
		await writeFile(
			path.join(postsRoot, 'post.md'),
			'---\ntitle: Existing\nslug: existing\n---\nBody',
		)
		const files = await readSiteFiles(siteRoot)
		await expect(
			validatePinnedPostSlugs(files.landing, postsRoot),
		).rejects.toThrow('missing')
	})

	test('one-time export maps UUID pins to slugs and omits database/UI identifiers', () => {
		const profile = {
			name: 'Example',
			title: 'Engineer',
			bio: '',
			avatar: 'https://legacy.example.com/avatar.webp',
			socialLinks: [{ platform: 'GitHub', url: 'https://github.com/example' }],
			skills: [
				{
					id: 'generated-skill-id',
					category: 'Engineering',
					technologies: [{ id: 'generated-tech-id', name: 'TypeScript' }],
				},
			],
			aboutPageConfig: {
				headline: 'About me',
				educationTimeline: [],
			},
			slogans: [{ id: 'generated-slogan-id', text: 'Build carefully' }],
			landingPageConfig: { pinnedPostIds: ['post-id'] },
		} as unknown as SiteProfile & { avatar: string }
		const result = toSiteFilesForExport(
			profile,
			new Map([['post-id', 'post-slug']]),
		)
		expect(result.files.profile.portraitImage).toBe('portrait.webp')
		expect(result.files.landing.pinnedPostSlugs).toEqual(['post-slug'])
		expect(result.files.profile.skills?.[0]).toEqual({
			category: 'Engineering',
			technologies: [{ name: 'TypeScript' }],
		})
		expect(result.files.profile.about).toEqual({
			headline: 'About me',
			educationTimeline: [],
		})
		expect(result.files.landing.slogans).toEqual([{ text: 'Build carefully' }])
		expect(
			siteFileSchemaByName['profile.yaml'].safeParse(result.files.profile)
				.success,
		).toBe(true)
		expect(
			siteFileSchemaByName['landing.yaml'].safeParse(result.files.landing)
				.success,
		).toBe(true)
		expect(
			siteFileSchemaByName['theme.yaml'].safeParse(result.files.theme).success,
		).toBe(true)
		expect(result.hasLegacyAvatar).toBe(true)
		expect(result.unmappedPinnedIds).toEqual([])
	})

	test('site dry-run rejects a missing required Site YAML file', async () => {
		const siteRoot = await createSiteFixture()
		await rm(path.join(siteRoot, 'theme.yaml'))
		await expect(publishSite({ dryRun: true, siteRoot })).rejects.toThrow(
			'theme.yaml',
		)
	})

	test('rejects legacy split YAML files instead of silently ignoring them', async () => {
		const siteRoot = await createSiteFixture()
		await writeFile(path.join(siteRoot, 'social.yaml'), '- platform: GitHub\n')
		await expect(readSiteFiles(siteRoot)).rejects.toThrow('social.yaml')
	})
})

afterAll(async () => {
	await Promise.all(
		temporaryRoots.map((root) => rm(root, { recursive: true, force: true })),
	)
})
