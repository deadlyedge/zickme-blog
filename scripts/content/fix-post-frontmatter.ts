import type { Stats } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import {
	generateTitleFromFileName,
	normalizeTags,
} from '../../src/lib/content/post-frontmatter'
import { normalizePostMetadata } from '../../src/lib/post-metadata'
import { generateSlugFromPath } from '../../src/lib/slug'
import type { MarkdownFrontmatter } from '../../src/types/post-types'
import type { ContentCheckResult } from './content-check-types'

interface StandardFrontmatter {
	title: string
	slug: string
	date: string
	tags: string[]
	status: string
	excerpt?: string
	image?: string
	sourceUrl?: string
	metadata?: ReturnType<typeof normalizePostMetadata>
}

export function generateStandardFrontmatter(
	frontmatter: MarkdownFrontmatter,
	filePath: string,
	postsDir: string,
	fileName: string,
	stats: Stats,
): string {
	const standard: StandardFrontmatter = {
		title: frontmatter.title || generateTitleFromFileName(fileName),
		slug: frontmatter.slug || generateSlugFromPath(filePath, postsDir),
		date: frontmatter.date || stats.birthtime.toISOString().split('T')[0] || '',
		tags: normalizeTags(frontmatter.tags),
		status: frontmatter.draft ? 'draft' : frontmatter.status || 'published',
	}

	if (frontmatter.excerpt) standard.excerpt = frontmatter.excerpt
	if (frontmatter.image) standard.image = frontmatter.image
	if (frontmatter.sourceUrl) standard.sourceUrl = frontmatter.sourceUrl

	const metadata = normalizePostMetadata(frontmatter)
	if (
		metadata.links.length > 0 ||
		metadata.category ||
		metadata.series ||
		metadata.canonicalUrl ||
		metadata.outdatedWarning ||
		metadata.layout
	)
		standard.metadata = metadata

	return matter.stringify('', standard).trim()
}

export async function fixPostFrontmatter(
	result: ContentCheckResult,
	postsDir: string,
	conflictingSlugs: Set<string>,
	options: { dryRun: boolean },
): Promise<boolean> {
	if (
		!result.slug ||
		(!result.issues.some((issue) => issue.includes('缺少 slug 字段')) &&
			result.issues.length === 0) ||
		conflictingSlugs.has(result.slug)
	)
		return false

	const fileContent = await fs.readFile(result.filePath, 'utf8')
	const stats = await fs.stat(result.filePath)
	const fileName = path.basename(result.filePath, '.md')
	const { data: frontmatter, content } = matter(fileContent)
	const standardFrontmatter = generateStandardFrontmatter(
		frontmatter as MarkdownFrontmatter,
		result.filePath,
		postsDir,
		fileName,
		stats,
	)
	const newContent = `${standardFrontmatter}\n\n${content.trim()}\n`
	if (options.dryRun) return false

	await fs.writeFile(result.filePath, newContent, 'utf8')
	return true
}
