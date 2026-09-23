import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { normalizeTags } from '../../src/lib/content/post-frontmatter'
import { normalizePostMetadata } from '../../src/lib/post-metadata'
import { generateSlugFromPath } from '../../src/lib/slug'
import type { ContentCheckResult } from './content-check-types'

export async function scanMarkdownFiles(directory: string): Promise<string[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name)
		if (entry.isDirectory()) {
			if (entry.name !== 'images')
				files.push(...(await scanMarkdownFiles(fullPath)))
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath)
		}
	}

	return files
}

async function validateImagePath(
	imagePath: string | undefined,
	filePath: string,
): Promise<{ isValid: boolean; error?: string }> {
	if (!imagePath?.startsWith('./images/')) return { isValid: true }

	const fileDir = path.dirname(filePath)
	const imageName = imagePath.replace('./images/', '')
	const imageAbsolutePath = path.join(fileDir, 'images', imageName)

	try {
		const stats = await fs.stat(imageAbsolutePath)
		return stats.isFile()
			? { isValid: true }
			: { isValid: false, error: '路径指向的不是文件' }
	} catch {
		return { isValid: false, error: '图片文件不存在' }
	}
}

export async function checkPostFile(
	filePath: string,
	postsDir: string,
): Promise<ContentCheckResult> {
	const result: ContentCheckResult = {
		filePath,
		issues: [],
		suggestions: [],
	}

	try {
		const fileContent = await fs.readFile(filePath, 'utf8')
		const { data: frontmatter } = matter(fileContent)
		const slug = frontmatter.slug || generateSlugFromPath(filePath, postsDir)
		result.slug = slug

		if (!frontmatter.title) result.issues.push('❌ 缺少 title 字段')
		if (!frontmatter.slug)
			result.issues.push('⚠️ 缺少 slug 字段 (将从路径自动生成)')
		if (!frontmatter.date) result.suggestions.push('💡 建议添加 date 字段')
		if (!frontmatter.tags || normalizeTags(frontmatter.tags).length === 0)
			result.suggestions.push('💡 建议添加 tags 字段')
		if (!frontmatter.excerpt)
			result.suggestions.push('💡 建议添加 excerpt 字段')

		if (frontmatter.image) {
			const imageValidation = await validateImagePath(
				frontmatter.image,
				filePath,
			)
			if (!imageValidation.isValid)
				result.issues.push(
					`❌ 封面图片错误: ${frontmatter.image} (${imageValidation.error})`,
				)
		}

		const metadata = normalizePostMetadata(frontmatter)
		if (frontmatter.links && metadata.links.length !== frontmatter.links.length)
			result.issues.push('❌ links 中存在无效或非 HTTP(S) 外链')
		if (
			frontmatter.canonicalUrl &&
			!/^https?:\/\//i.test(frontmatter.canonicalUrl)
		)
			result.issues.push('❌ canonicalUrl 必须使用 HTTP(S) URL')
	} catch (error) {
		result.issues.push(
			`❌ 解析文件失败: ${error instanceof Error ? error.message : String(error)}`,
		)
	}

	return result
}
export async function getPostSlugSourceMap(
	files: string[],
	postsDir: string,
): Promise<Map<string, string[]>> {
	const slugSources = new Map<string, string[]>()
	for (const filePath of files) {
		const { data } = matter(await fs.readFile(filePath, 'utf8'))
		const slug =
			typeof data.slug === 'string' && data.slug.trim()
				? data.slug.trim()
				: generateSlugFromPath(filePath, postsDir)
		const sources = slugSources.get(slug) || []
		sources.push(path.relative(postsDir, filePath))
		slugSources.set(slug, sources)
	}
	return slugSources
}

export async function checkPosts(postsDir: string): Promise<{
	files: string[]
	results: ContentCheckResult[]
	conflictingSlugs: Set<string>
}> {
	const files = await scanMarkdownFiles(postsDir)
	const slugSources = await getPostSlugSourceMap(files, postsDir)
	const conflictingSlugs = new Set(
		[...slugSources.entries()]
			.filter(([, sources]) => sources.length > 1)
			.map(([slug]) => slug),
	)
	const results = await Promise.all(
		files.map((filePath) => checkPostFile(filePath, postsDir)),
	)
	for (const result of results) {
		if (result.slug && conflictingSlugs.has(result.slug))
			result.issues.push(`❌ Slug 冲突: "${result.slug}"，请修改为唯一值`)
	}

	return { files, results, conflictingSlugs }
}
