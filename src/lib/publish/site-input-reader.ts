import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import sharp from 'sharp'
import { parse } from 'yaml'
import type { z } from 'zod'
import {
	SITE_PORTRAIT_MAX_BYTES,
	SITE_PORTRAIT_MAX_DIMENSION,
} from '@/constants/media'
import { generateSlugFromPath } from '@/lib/slug'
import type { SiteProfileInsert } from './site-repository'
import {
	SITE_FILE_NAMES,
	type SiteFiles,
	siteFileSchemaByName,
} from './site-schema'

export const SITE_CONTENT_ROOT = path.join(process.cwd(), 'content/site')
export const SITE_PORTRAIT_PATH = path.join(SITE_CONTENT_ROOT, 'portrait.webp')

export class SiteContentError extends Error {
	constructor(
		message: string,
		readonly filePath?: string,
	) {
		super(message)
		this.name = 'SiteContentError'
	}
}

async function assertPathInsideSiteRoot(
	root: string,
	filePath: string,
): Promise<void> {
	const realRoot = await fs.realpath(root)
	const realFile = await fs.realpath(filePath)
	const relative = path.relative(realRoot, realFile)
	if (
		relative === '..' ||
		relative.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relative)
	)
		throw new SiteContentError(
			'拒绝读取站点内容目录之外的符号链接目标。',
			filePath,
		)
}

async function readYamlFile<TSchema extends z.ZodType>(
	root: string,
	fileName: (typeof SITE_FILE_NAMES)[number],
	schema: TSchema,
): Promise<z.output<TSchema>> {
	const filePath = path.join(root, fileName)
	let raw: string
	try {
		await assertPathInsideSiteRoot(root, filePath)
		raw = await fs.readFile(filePath, 'utf8')
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT')
			throw new SiteContentError(
				`必需的站点设置文件缺失：${fileName}`,
				filePath,
			)
		throw error
	}
	let value: unknown
	try {
		value = parse(raw, { uniqueKeys: true })
	} catch (error) {
		throw new SiteContentError(
			`${fileName} YAML 解析失败：${error instanceof Error ? error.message : String(error)}`,
			filePath,
		)
	}
	const result = schema.safeParse(value)
	if (!result.success) {
		const details = result.error.issues
			.map((issue) => `${issue.path.join('.') || '(root)'}：${issue.message}`)
			.join('；')
		throw new SiteContentError(`${fileName} 校验失败：${details}`, filePath)
	}
	return result.data as z.output<TSchema>
}

export async function validateSitePortrait(
	root = SITE_CONTENT_ROOT,
): Promise<void> {
	const profile = await readYamlFile(
		root,
		'profile.yaml',
		siteFileSchemaByName['profile.yaml'],
	)
	if (!profile.portraitImage) return
	const expected = path.join(root, 'portrait.webp')
	let file: Buffer
	try {
		await assertPathInsideSiteRoot(root, expected)
		file = await fs.readFile(expected)
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT')
			throw new SiteContentError(
				'profile.yaml 引用了 portrait.webp，但文件不存在。',
				expected,
			)
		throw error
	}
	if (file.byteLength === 0 || file.byteLength > SITE_PORTRAIT_MAX_BYTES)
		throw new SiteContentError(
			`portrait.webp 必须大于 0 且不超过 ${SITE_PORTRAIT_MAX_BYTES / 1024 / 1024} MB。`,
			expected,
		)
	const metadata = await sharp(file)
		.metadata()
		.catch(() => null)
	if (
		metadata?.format !== 'webp' ||
		!metadata.width ||
		!metadata.height ||
		metadata.width > SITE_PORTRAIT_MAX_DIMENSION ||
		metadata.height > SITE_PORTRAIT_MAX_DIMENSION
	)
		throw new SiteContentError(
			`portrait.webp 必须是有效 WebP，宽高不得超过 ${SITE_PORTRAIT_MAX_DIMENSION}px。`,
			expected,
		)
}

export async function readSiteFiles(
	root = SITE_CONTENT_ROOT,
): Promise<SiteFiles> {
	const entries = await fs
		.readdir(root, { withFileTypes: true })
		.catch((error) => {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT')
				throw new SiteContentError('content/site 目录缺失。', root)
			throw error
		})
	const allowedNames = new Set<string>([...SITE_FILE_NAMES, 'portrait.webp'])
	const unexpected = entries.filter((entry) => !allowedNames.has(entry.name))
	if (unexpected.length > 0)
		throw new SiteContentError(
			`content/site 包含不支持的文件或目录：${unexpected.map((entry) => entry.name).join(', ')}`,
			path.join(root, unexpected[0]?.name ?? ''),
		)
	const [profile, social, skills, slogans, theme, landing, about] =
		await Promise.all([
			readYamlFile(root, 'profile.yaml', siteFileSchemaByName['profile.yaml']),
			readYamlFile(root, 'social.yaml', siteFileSchemaByName['social.yaml']),
			readYamlFile(root, 'skills.yaml', siteFileSchemaByName['skills.yaml']),
			readYamlFile(root, 'slogans.yaml', siteFileSchemaByName['slogans.yaml']),
			readYamlFile(root, 'theme.yaml', siteFileSchemaByName['theme.yaml']),
			readYamlFile(root, 'landing.yaml', siteFileSchemaByName['landing.yaml']),
			readYamlFile(root, 'about.yaml', siteFileSchemaByName['about.yaml']),
		])
	if (profile.portraitImage) await validateSitePortrait(root)
	return { profile, social, skills, slogans, theme, landing, about }
}

export async function listLocalPostSlugs(
	postsRoot = path.join(process.cwd(), 'content/posts'),
): Promise<Set<string>> {
	const slugs = new Set<string>()
	async function walk(directory: string): Promise<void> {
		const entries = await fs
			.readdir(directory, { withFileTypes: true })
			.catch(() => [])
		for (const entry of entries) {
			const filePath = path.join(directory, entry.name)
			if (entry.isDirectory()) await walk(filePath)
			else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
				const parsed = matter(await fs.readFile(filePath, 'utf8'))
				const slug =
					typeof parsed.data.slug === 'string' && parsed.data.slug.trim()
						? parsed.data.slug.trim()
						: generateSlugFromPath(filePath, postsRoot)
				slugs.add(slug)
			}
		}
	}
	await walk(postsRoot)
	return slugs
}

export async function validatePinnedPostSlugs(
	landing: SiteFiles['landing'],
	postsRoot = path.join(process.cwd(), 'content/posts'),
): Promise<void> {
	const pinnedSlugs: string[] = landing?.pinnedPostSlugs ?? []
	if (pinnedSlugs.length === 0) return
	const localSlugs = await listLocalPostSlugs(postsRoot)
	const missing = pinnedSlugs.filter((slug) => !localSlugs.has(slug))
	if (missing.length > 0)
		throw new SiteContentError(
			`landing.yaml 中的 pinnedPostSlugs 未在本地 Markdown 找到：${missing.join(', ')}`,
			path.join(SITE_CONTENT_ROOT, 'landing.yaml'),
		)
}

export function getSitePublishValues(
	files: SiteFiles,
	avatarUrl: string | null,
	pinnedPostIds: string[],
): SiteProfileInsert {
	const { portraitImage: _portraitImage, ...profile } = files.profile
	return {
		...profile,
		location: profile.location ?? null,
		email: profile.email ?? null,
		website: profile.website ?? null,
		avatar: avatarUrl,
		socialLinks: files.social,
		skills: files.skills,
		slogans: files.slogans,
		themeConfig: files.theme,
		landingPageConfig: files.landing
			? {
					enabled: files.landing.enabled,
					showTopHottest: files.landing.showTopHottest,
					showSlogans: files.landing.showSlogans,
					showPinnedPosts: files.landing.showPinnedPosts,
					showLatestPosts: files.landing.showLatestPosts,
					pinnedPostIds,
				}
			: null,
		aboutPageConfig: files.about,
	}
}
