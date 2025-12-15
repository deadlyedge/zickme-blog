import matter from 'gray-matter'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import { StatusType } from '../src/generated/prisma/enums'
import type { Stats } from 'fs'
import { generateSlugFromPath } from '@/lib/slug'

interface MarkdownFrontmatter {
	title?: string
	excerpt?: string
	image?: string
	tags?: string[] | string
	date?: string
	slug?: string
	status?: string
	draft?: boolean
	images?: Array<{ image: string; caption?: string }>
	sourceUrl?: string
}

interface StandardFrontmatter {
	title: string
	slug: string
	date: string
	tags: string[]
	status: string
	excerpt?: string
	image?: string
	images?: Array<{ image: string; caption?: string }>
	sourceUrl?: string
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
 * 获取文章类型
 */
function getPostType(filePath: string, postsDir: string): 'BLOG' | 'PROJECT' {
	const relativePath = path.relative(postsDir, filePath)
	const normalizedPath = relativePath.replace(/\\/g, '/')
	if (normalizedPath.startsWith('blogs/')) return 'BLOG'
	if (normalizedPath.startsWith('projects/')) return 'PROJECT'
	return 'BLOG'
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
function normalizeTags(tags: string[] | string | undefined): string[] {
	if (!tags) return []
	if (Array.isArray(tags)) return tags
	if (typeof tags === 'string') {
		// 支持逗号分隔的字符串标签
		return tags
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
	// postsDir: string,
): Promise<{ isValid: boolean; absolutePath?: string; error?: string }> {
	if (!imagePath) return { isValid: true }

	// 只验证 ./images/ 格式的引用
	if (imagePath.startsWith('./images/')) {
		// 获取当前文件所在的文件夹
		const fileDir = path.dirname(filePath)
		const imageName = imagePath.replace('./images/', '')
		const imageAbsolutePath = path.join(fileDir, 'images', imageName)

		try {
			// 检查文件是否存在
			const stats = await fsPromises.stat(imageAbsolutePath)
			if (stats.isFile()) {
				return { isValid: true, absolutePath: imageAbsolutePath }
			} else {
				return { isValid: false, error: '路径指向的不是文件' }
			}
		} catch {
			return { isValid: false, error: '图片文件不存在' }
		}
	}

	// 对于其他格式的图片路径，暂时不验证
	return { isValid: true }
}

/**
 * 生成标准的frontmatter（使用matter.stringify）
 */
function generateStandardFrontmatter(
	frontmatter: MarkdownFrontmatter,
	filePath: string,
	postsDir: string,
	fileName: string,
	stats: Stats,
): string {
	const postType = getPostType(filePath, postsDir)
	const isProject = postType === 'PROJECT'

	// 构建标准化的frontmatter对象
	const standardData: StandardFrontmatter = {
		title: frontmatter.title || generateTitleFromFileName(fileName),
		slug: frontmatter.slug || generateSlugFromPath(filePath, postsDir),
		date: frontmatter.date || stats.mtime.toISOString().split('T')[0],
		tags: normalizeTags(frontmatter.tags),
		status:
			frontmatter.draft === true ? 'draft' : frontmatter.status || 'published',
	}

	// 项目特定的字段
	if (isProject) {
		standardData.excerpt = frontmatter.excerpt || ''
		standardData.images =
			frontmatter.images ||
			(frontmatter.image ? [{ image: frontmatter.image }] : [])
		standardData.sourceUrl = frontmatter.sourceUrl || ''
	}

	// 博客特定的字段
	if (!isProject) {
		standardData.excerpt = frontmatter.excerpt || ''
		standardData.image = frontmatter.image || ''
	}

	// 使用matter.stringify生成安全格式
	return matter.stringify('', standardData)
}

/**
 * 检查单个markdown文件
 */
async function checkMarkdownFile(
	filePath: string,
	config: CheckConfig,
): Promise<ContentCheckResult> {
	/**
	 * 转换状态字符串为StatusType枚举值
	 */
	function parseStatusType(
		statusStr: string | undefined,
		draft: boolean | undefined,
	): StatusType | undefined {
		if (draft === true) return StatusType.DRAFT
		if (statusStr) {
			const upperStatus = statusStr.toUpperCase()
			if (Object.values(StatusType).includes(upperStatus as StatusType)) {
				return upperStatus as StatusType
			}
		}
		return undefined // 默认为null，让数据库使用默认值PUBLISHED
	}

	const result: ContentCheckResult = {
		filePath,
		issues: [],
		suggestions: [],
	}

	try {
		const content = await fsPromises.readFile(filePath, 'utf8')
		const stats = await fsPromises.stat(filePath)
		const fileName = path.basename(filePath, '.md')
		const postType = getPostType(filePath, config.postsDir)

		// 解析frontmatter
		const { data: frontmatter } = matter(content)

		// 检查必需字段
		if (!frontmatter.title) {
			result.issues.push('❌ 缺少 title 字段')
			result.suggestions.push('💡 建议: 添加 title 字段描述文章标题')
		}

		// 检查推荐字段
		if (!frontmatter.date) {
			result.issues.push('⚠️ 缺少 date 字段')
			result.suggestions.push('💡 建议: 添加 date 字段 (格式: YYYY-MM-DD)')
		}

		if (!frontmatter.tags || normalizeTags(frontmatter.tags).length === 0) {
			result.issues.push('⚠️ 缺少 tags 字段')
			result.suggestions.push('💡 建议: 添加 tags 字段描述文章标签')
		}

		// 项目特定检查
		if (postType === 'PROJECT') {
			if (!frontmatter.excerpt) {
				result.issues.push('⚠️ 项目缺少 excerpt 字段')
				result.suggestions.push('💡 建议: 为项目添加简短描述 excerpt 字段')
			}

			if (!frontmatter.image && !frontmatter.images) {
				result.issues.push('⚠️ 项目缺少图片')
				result.suggestions.push(
					'💡 建议: 添加 image 或 images 字段展示项目截图',
				)
			}

			if (!frontmatter.sourceUrl) {
				result.issues.push('ℹ️ 项目缺少源码链接')
				result.suggestions.push('💡 可选: 添加 sourceUrl 字段指向项目源码')
			}
		}

		// 博客特定检查
		if (postType === 'BLOG') {
			if (!frontmatter.excerpt) {
				result.issues.push('⚠️ 博客文章缺少 excerpt 字段')
				result.suggestions.push('💡 建议: 添加 excerpt 字段提供文章摘要')
			}
		}

		// 状态字段检查 - 使用与sync相同的逻辑
		const parsedStatus = parseStatusType(frontmatter.status, frontmatter.draft)
		if (frontmatter.draft === true) {
			result.suggestions.push('ℹ️ 文章标记为草稿状态 (draft: true)')
		} else if (frontmatter.status && parsedStatus === undefined) {
			result.issues.push(`❌ 无效的状态值: ${frontmatter.status}`)
			result.suggestions.push(
				`💡 有效状态: ${Object.values(StatusType).join(', ')}`,
			)
		}

		// 图片路径验证
		if (frontmatter.image) {
			const imageValidation = await validateImagePath(
				frontmatter.image,
				filePath,
			)
			if (!imageValidation.isValid) {
				result.issues.push(`❌ 封面图片不存在: ${frontmatter.image}`)
				result.suggestions.push(`💡 错误: ${imageValidation.error}`)
			}
		}

		// 项目图片数组验证
		if (frontmatter.images && Array.isArray(frontmatter.images)) {
			for (const imageItem of frontmatter.images) {
				if (imageItem.image) {
					const imageValidation = await validateImagePath(
						imageItem.image,
						filePath,
					)
					if (!imageValidation.isValid) {
						result.issues.push(`❌ 项目图片不存在: ${imageItem.image}`)
						result.suggestions.push(`💡 错误: ${imageValidation.error}`)
					}
				}
			}
		}

		// 生成标准化的frontmatter
		const standardFrontmatter = generateStandardFrontmatter(
			frontmatter,
			filePath,
			config.postsDir,
			fileName,
			stats,
		)
		result.formattedFrontmatter = standardFrontmatter

		// 如果需要自动修复
		if (
			config.autoFix &&
			result.issues.some(
				(issue) => issue.startsWith('❌') || issue.startsWith('⚠️'),
			)
		) {
			// 提取文章正文（去掉原来的frontmatter）
			const bodyMatch = content.match(/^---[\s\S]*?---\n?([\s\S]*)$/)
			const body = bodyMatch ? bodyMatch[1] : content
			const newContent = standardFrontmatter + body
			await fsPromises.writeFile(filePath, newContent, 'utf8')
			result.suggestions.push('✅ 已自动修复frontmatter格式')
		}
	} catch (error) {
		result.issues.push(`❌ 文件读取失败: ${error}`)
	}

	return result
}

/**
 * 递归扫描所有Markdown文件
 */
async function scanMarkdownFiles(dirPath: string): Promise<string[]> {
	const files: string[] = []

	async function scan(dir: string) {
		const entries = await fsPromises.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				await scan(fullPath)
			} else if (entry.isFile() && entry.name.endsWith('.md')) {
				files.push(fullPath)
			}
		}
	}

	await scan(dirPath)
	return files
}

/**
 * 显示字段填写指南
 */
function showFieldGuide() {
	console.log('\n📚 Markdown Frontmatter 字段填写指南\n')

	console.log('🔹 通用字段 (所有文章都需要):')
	console.log('  title      : 文章标题 (必需)')
	console.log('  date       : 发布时间 (格式: YYYY-MM-DD, 建议填写)')
	console.log('  tags       : 标签数组或逗号分隔字符串 (建议填写)')
	console.log('  status     : 文章状态 (published/draft/archived/pending/spam)')
	console.log('  draft      : 布尔值，设为true表示草稿 (优先级高于status)')

	console.log('\n🔹 博客文章字段:')
	console.log('  excerpt    : 文章摘要 (建议填写)')
	console.log('  image      : 封面图片路径 (./images/xxx.jpg)')

	console.log('\n🔹 项目展示字段:')
	console.log('  excerpt    : 项目简介 (必需)')
	console.log('  images     : 项目截图数组')
	console.log('    - image  : 图片路径')
	console.log('      caption: 图片说明 (可选)')
	console.log('  sourceUrl  : 项目源码链接 (可选)')

	console.log('\n💡 示例:\n')

	console.log('博客文章示例:')
	console.log(`---
title: "React 最佳实践指南"
date: "2025-12-09"
tags: ["React", "JavaScript", "前端开发"]
status: "published"
excerpt: "本文介绍了React开发中的最佳实践和常见模式"
image: "./images/react-guide.jpg"
---`)

	console.log('\n项目示例:')
	console.log(`---
title: "个人博客网站"
date: "2025-12-08"
tags: ["Next.js", "React", "TypeScript"]
status: "published"
excerpt: "使用Next.js构建的现代化个人博客网站"
images:
  - image: "./images/homepage.jpg"
    caption: "网站首页截图"
  - image: "./images/blog-post.jpg"
    caption: "博客文章页面"
sourceUrl: "https://github.com/username/blog"
---`)

	console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * 主检查函数
 */
async function checkContent(config: CheckConfig = DEFAULT_CONFIG) {
	console.log('🔍 开始检查本地内容...\n')

	if (config.showExamples) {
		showFieldGuide()
	}

	try {
		// 扫描所有Markdown文件
		const mdFiles = await scanMarkdownFiles(config.postsDir)
		console.log(`📁 发现 ${mdFiles.length} 个Markdown文件\n`)

		// 检查每个文件
		const results = await Promise.all(
			mdFiles.map((file) => checkMarkdownFile(file, config)),
		)

		let totalIssues = 0
		let totalSuggestions = 0

		for (const result of results) {
			const relativePath = path.relative(config.postsDir, result.filePath)
			console.log(`📄 ${relativePath}`)

			if (result.issues.length > 0) {
				result.issues.forEach((issue) => console.log(`   ${issue}`))
				totalIssues += result.issues.length
			}

			if (result.suggestions.length > 0) {
				result.suggestions.forEach((suggestion) =>
					console.log(`   ${suggestion}`),
				)
				totalSuggestions += result.suggestions.length
			}

			// 显示标准化的frontmatter (如果有问题)
			if (
				result.formattedFrontmatter &&
				(result.issues.length > 0 || config.dryRun)
			) {
				console.log('   📝 推荐的标准化frontmatter:')
				console.log('   ---')
				result.formattedFrontmatter.split('\n').forEach((line) => {
					console.log(`   ${line}`)
				})
				console.log('   ---')
			}

			console.log('')
		}

		// 统计信息
		console.log('📊 检查结果统计:')
		console.log(`   🔍 检查文件: ${mdFiles.length}`)
		console.log(`   ⚠️ 发现问题: ${totalIssues}`)
		console.log(`   💡 提供建议: ${totalSuggestions}`)

		if (config.dryRun) {
			console.log('\n💡 使用 --fix 参数自动修复问题')
			console.log('💡 使用 --no-examples 隐藏示例指南')
		}

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

// 如果直接运行此脚本
if (require.main === module) {
	checkContent().catch(console.error)
}

export { checkContent, DEFAULT_CONFIG }
export type { CheckConfig, ContentCheckResult }
