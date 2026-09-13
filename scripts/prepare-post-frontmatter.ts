import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import {
	generateTitleFromFileName,
	normalizeTags,
} from '../src/lib/content/post-frontmatter'
import type { MarkdownFrontmatter } from '../src/lib/content/post-types'
import { generateSlugFromPath } from '../src/lib/slug'

export type FrontmatterPreparationResult = {
	checked: number
	changed: string[]
	missingFrontmatter: string[]
}

async function scanMarkdownFiles(postsDir: string): Promise<string[]> {
	const entries = await fs.readdir(postsDir, { withFileTypes: true })
	const files: string[] = []
	for (const entry of entries) {
		const filePath = path.join(postsDir, entry.name)
		if (entry.isDirectory()) {
			if (entry.name !== 'images')
				files.push(...(await scanMarkdownFiles(filePath)))
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(filePath)
		}
	}
	return files
}

function hasRequiredFrontmatter(data: MarkdownFrontmatter): boolean {
	return Boolean(data.title && data.slug && data.date && data.status)
}

function buildFrontmatter(
	data: MarkdownFrontmatter,
	filePath: string,
	postsDir: string,
	fileName: string,
	createdAt: Date,
) {
	return {
		title: data.title || generateTitleFromFileName(fileName),
		slug: data.slug || generateSlugFromPath(filePath, postsDir),
		date: data.date || createdAt.toISOString().split('T')[0],
		tags: normalizeTags(data.tags),
		status: data.draft ? 'draft' : data.status || 'published',
		...(data.excerpt ? { excerpt: data.excerpt } : {}),
		...(data.image ? { image: data.image } : {}),
		...(data.sourceUrl ? { sourceUrl: data.sourceUrl } : {}),
	}
}

export async function preparePostFrontmatter(
	postsDir = path.join(process.cwd(), 'content/posts'),
	dryRun = true,
): Promise<FrontmatterPreparationResult> {
	const files = await scanMarkdownFiles(postsDir)
	const result: FrontmatterPreparationResult = {
		checked: files.length,
		changed: [],
		missingFrontmatter: [],
	}

	for (const filePath of files) {
		const source = await fs.readFile(filePath, 'utf8')
		const parsed = matter(source)
		if (hasRequiredFrontmatter(parsed.data as MarkdownFrontmatter)) continue

		const relativePath = path.relative(process.cwd(), filePath)
		const fileName = path.basename(filePath, '.md')
		const stats = await fs.stat(filePath)
		const next = matter.stringify(
			parsed.content,
			buildFrontmatter(
				parsed.data as MarkdownFrontmatter,
				filePath,
				postsDir,
				fileName,
				stats.birthtime,
			),
		)
		result.changed.push(relativePath)
		if (!source.trimStart().startsWith('---'))
			result.missingFrontmatter.push(relativePath)
		if (!dryRun) await fs.writeFile(filePath, next, 'utf8')
	}

	return result
}
