import type { Stats } from 'node:fs'
import * as fsPromises from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { normalizePostMetadata } from '../src/lib/post-metadata'
import { generateSlugFromPath } from '../src/lib/slug'

interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[] | string
	date?: string
	slug?: string
	status?: string
	draft?: boolean
	sourceUrl?: string
	links?: unknown[]
	github?: string
	demo?: string
	figma?: string
	paper?: string
	category?: string
	series?: string
	canonicalUrl?: string
	outdatedWarning?: string
	layout?: 'article' | 'gallery' | 'photo'
}

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

interface ContentCheckResult {
	filePath: string
	issues: string[]
	suggestions: string[]
	formattedFrontmatter?: string
}

interface CheckConfig {
	dryRun: boolean
	autoFix: boolean
	showExamples: boolean
	postsDir: string
}

const DEFAULT_CONFIG: CheckConfig = {
	dryRun: process.argv.includes('--dry-run'),
	autoFix: process.argv.includes('--fix'),
	showExamples: !process.argv.includes('--no-examples'),
	postsDir: path.join(process.cwd(), 'content/posts'),
}

/**
 * 从文件名生成标题
 */
function generateTitleFromFileName(fileName: string): string {
	return fileName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

/**
 * 规范化标签数组
 */
function normalizeTags(tagsInput: string[] | string | undefined): string[] {
	if (!tagsInput) return []
	if (Array.isArray(tagsInput)) return tagsInput
	if (typeof tagsInput === 'string') {
		return tagsInput
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag.length > 0)
	}
	return []
}

/**
 * 处理图片URL，根据文件位置找到对应的本地图片路径
 */
async function validateImagePath(
	imagePath: string | undefined,
	filePath: string,
): Promise<{ isValid: boolean; absolutePath?: string; error?: string }> {
	if (!imagePath) return { isValid: true }

	if (imagePath.startsWith('./images/')) {
		const fileDir = path.dirname(filePath)
		const imageName = imagePath.replace('./images/', '')
		const imageAbsolutePath = path.join(fileDir, 'images', imageName)

		try {
			const stats = await fsPromises.stat(imageAbsolutePath)
			if (stats.isFile()) {
				return { isValid: true, absolutePath: imageAbsolutePath }
			}
			return { isValid: false, error: '路径指向的不是文件' }
		} catch {
			return { isValid: false, error: '图片文件不存在' }
		}
	}

	return { isValid: true }
}

/**
 * 生成标准的frontmatter
 */
function generateStandardFrontmatter(
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

	if (frontmatter.excerpt) {
		standard.excerpt = frontmatter.excerpt
	}

	if (frontmatter.image) {
		standard.image = frontmatter.image
	}

	if (frontmatter.sourceUrl) {
		standard.sourceUrl = frontmatter.sourceUrl
	}

	const metadata = normalizePostMetadata(frontmatter)
	if (
		metadata.links.length > 0 ||
		metadata.category ||
		metadata.series ||
		metadata.canonicalUrl ||
		metadata.outdatedWarning ||
		metadata.layout
	) {
		standard.metadata = metadata
	}

	const stringified = matter.stringify('', standard)
	return stringified.trim()
}

/**
 * 递归扫描所有Markdown文件
 */
async function scanMarkdownFiles(dir: string): Promise<string[]> {
	const entries = await fsPromises.readdir(dir, { withFileTypes: true })
	const files: string[] = []

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name)

		if (entry.isDirectory()) {
			if (entry.name !== 'images') {
				const subFiles = await scanMarkdownFiles(fullPath)
				files.push(...subFiles)
			}
		} else if (entry.isFile() && entry.name.endsWith('.md')) {
			files.push(fullPath)
		}
	}

	return files
}

/**
 * 检查单个Markdown文件
 */
async function checkMarkdownFile(
	filePath: string,
	config: CheckConfig,
): Promise<ContentCheckResult> {
	const result: ContentCheckResult = {
		filePath,
		issues: [],
		suggestions: [],
	}

	try {
		const fileContent = await fsPromises.readFile(filePath, 'utf-8')
		const stats = await fsPromises.stat(filePath)
		const fileName = path.basename(filePath, '.md')

		const { data: frontmatter, content } = matter(fileContent)

		if (!frontmatter.title) {
			result.issues.push('❌ 缺少 title 字段')
		}

		if (!frontmatter.slug) {
			result.issues.push('⚠️ 缺少 slug 字段 (将从路径自动生成)')
		}

		if (!frontmatter.date) {
			result.suggestions.push('💡 建议添加 date 字段')
		}

		if (!frontmatter.tags || normalizeTags(frontmatter.tags).length === 0) {
			result.suggestions.push('💡 建议添加 tags 字段')
		}

		if (!frontmatter.excerpt) {
			result.suggestions.push('💡 建议添加 excerpt 字段')
		}

		if (frontmatter.image) {
			const imageValidation = await validateImagePath(
				frontmatter.image,
				filePath,
			)
			if (!imageValidation.isValid) {
				result.issues.push(
					`❌ 封面图片错误: ${frontmatter.image} (${imageValidation.error})`,
				)
			}
		}

		const metadata = normalizePostMetadata(frontmatter)
		if (
			frontmatter.links &&
			metadata.links.length !== frontmatter.links.length
		) {
			result.issues.push('❌ links 中存在无效或非 HTTP(S) 外链')
		}
		if (
			frontmatter.canonicalUrl &&
			!/^https?:\/\//i.test(frontmatter.canonicalUrl)
		) {
			result.issues.push('❌ canonicalUrl 必须使用 HTTP(S) URL')
		}

		if (config.autoFix && result.issues.length > 0) {
			const standardFrontmatter = generateStandardFrontmatter(
				frontmatter,
				filePath,
				config.postsDir,
				fileName,
				stats,
			)

			const newContent = `${standardFrontmatter}\n\n${content.trim()}\n`
			await fsPromises.writeFile(filePath, newContent, 'utf-8')
			result.suggestions.push('✅ 已自动修复 frontmatter 格式')
		}

		return result
	} catch (error) {
		result.issues.push(
			`❌ 解析文件失败: ${error instanceof Error ? error.message : String(error)}`,
		)
		return result
	}
}

/**
 * 主检查函数
 */
async function checkContent(config: CheckConfig = DEFAULT_CONFIG) {
	console.log('🔍 开始检查本地内容...\n')

	try {
		const mdFiles = await scanMarkdownFiles(config.postsDir)
		console.log(`📁 发现 ${mdFiles.length} 个Markdown文件\n`)

		const results = await Promise.all(
			mdFiles.map((file) => checkMarkdownFile(file, config)),
		)

		let totalIssues = 0
		let totalSuggestions = 0

		for (const result of results) {
			const relativePath = path.relative(config.postsDir, result.filePath)
			console.log(`📄 ${relativePath}`)

			if (result.issues.length > 0) {
				for (const issue of result.issues) {
					console.log(`   ${issue}`)
				}
				totalIssues += result.issues.length
			}

			if (result.suggestions.length > 0) {
				for (const suggestion of result.suggestions) {
					console.log(`   ${suggestion}`)
				}
				totalSuggestions += result.suggestions.length
			}

			console.log('')
		}

		console.log('📊 检查结果统计:')
		console.log(`   🔍 检查文件: ${mdFiles.length}`)
		console.log(`   ⚠️ 发现问题: ${totalIssues}`)
		console.log(`   💡 提供建议: ${totalSuggestions}`)

		if (totalIssues === 0) {
			console.log('\n✅ 所有文件检查通过！')
		} else {
			console.log(`\n⚠️ 发现 ${totalIssues} 个问题需要处理`)
		}
	} catch (error) {
		console.error('❌ 检查失败:', error)
		process.exit(1)
	}
}

if (require.main === module) {
	checkContent().catch(console.error)
}

export type { CheckConfig, ContentCheckResult }
export { checkContent, DEFAULT_CONFIG }
