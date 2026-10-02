import * as path from 'node:path'
import {
	readSiteFiles,
	validatePinnedPostSlugs,
} from '@/lib/publish/site-input-reader'
import { checkGalleries } from './content/check-galleries'
import { checkPosts } from './content/check-posts'
import type { CheckConfig } from './content/content-check-types'
import {
	fixGalleryAlbumConfig,
	fixGalleryIndex,
} from './content/fix-gallery-config'
import { fixPostFrontmatter } from './content/fix-post-frontmatter'

export type {
	CheckConfig,
	ContentCheckResult,
} from './content/content-check-types'

export const DEFAULT_CONFIG: CheckConfig = {
	dryRun: false,
	autoFix: false,
	showExamples: true,
	postsDir: path.join(process.cwd(), 'content/posts'),
	siteDir: path.join(process.cwd(), 'content/site'),
	scope: 'all',
}

export function parseContentScope(
	value: string | undefined,
): NonNullable<CheckConfig['scope']> {
	return value === 'posts' ||
		value === 'galleries' ||
		value === 'site' ||
		value === 'all'
		? value
		: 'all'
}

export function parseContentCliConfig(args: string[]): CheckConfig {
	const scopeIndex = args.indexOf('--scope')
	return {
		...DEFAULT_CONFIG,
		autoFix: args.includes('--fix') && !args.includes('--check-only'),
		dryRun: args.includes('--dry-run'),
		showExamples: !args.includes('--no-examples'),
		scope: parseContentScope(
			scopeIndex >= 0 ? args[scopeIndex + 1] : undefined,
		),
	}
}

async function checkPostsScope(config: CheckConfig) {
	const { files, results, conflictingSlugs } = await checkPosts(config.postsDir)

	console.log(`📁 发现 ${files.length} 个Markdown文件\n`)
	for (const slug of conflictingSlugs) {
		const sources = results
			.filter((result) => result.slug === slug)
			.map((result) => path.relative(config.postsDir, result.filePath))
		console.log(
			`❌ Slug 冲突 "${slug}": ${sources.join('、')}，请手动指定唯一 slug\n`,
		)
	}

	let totalIssues = 0
	let totalSuggestions = 0
	for (const result of results) {
		const relativePath = path.relative(config.postsDir, result.filePath)
		console.log(`📄 ${relativePath}`)
		for (const issue of result.issues) console.log(`   ${issue}`)
		for (const suggestion of result.suggestions) console.log(`   ${suggestion}`)
		totalIssues += result.issues.length
		totalSuggestions += result.suggestions.length

		if (config.autoFix) {
			try {
				const fixed = await fixPostFrontmatter(
					result,
					config.postsDir,
					conflictingSlugs,
					{ dryRun: config.dryRun },
				)
				if (fixed) {
					totalSuggestions++
					console.log('   ✅ 已自动修复 frontmatter 格式')
				}
			} catch (error) {
				totalIssues++
				console.log(
					`   ❌ 修复 Frontmatter 失败: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}
		console.log('')
	}

	return {
		files,
		results,
		conflictingSlugs,
		totalIssues,
		totalSuggestions,
	}
}

async function checkGalleriesScope(config: CheckConfig) {
	const scan = await checkGalleries(config.galleryRoot)
	let totalSuggestions = 0
	console.log('🖼️ 检查 Gallery 内容...')

	for (const album of scan.albums) {
		const albumName = path.basename(album.directory)
		console.log(`📷 ${albumName}`)
		for (const issue of album.issues) console.log(`   ❌ ${issue}`)

		if (config.autoFix) {
			const repair = await fixGalleryAlbumConfig(album, {
				dryRun: config.dryRun,
				galleryRoot: config.galleryRoot,
			})
			if (repair.changed && !config.dryRun) {
				totalSuggestions++
				console.log(
					repair.generated
						? '   ✅ 已生成 album.yaml（请编辑并确认人工维护字段）'
						: '   ✅ 已补齐 album.yaml 图片清单（保留已有人工字段）',
				)
			}
		}
	}

	if (config.autoFix) {
		if (!config.dryRun) {
			await fixGalleryIndex({
				dryRun: false,
				galleryRoot: config.galleryRoot,
			})
			console.log(
				'   ✅ 已生成 photo-gallery/gallery.yaml（自动文件，请勿手动编辑）',
			)
		} else {
			console.log('   ℹ️ dry-run：未写入 album.yaml 或 gallery.yaml')
			if (scan.albums.length > 0) totalSuggestions++
		}
	} else if (scan.albums.length > 0) {
		console.log(
			'   💡 使用 bun run content:fix 可显式生成/补齐 album.yaml 和 gallery.yaml',
		)
		totalSuggestions++
	}

	return { issues: scan.issues.length, suggestions: totalSuggestions }
}

async function checkSiteScope(config: CheckConfig): Promise<number> {
	console.log('🌐 检查 Site 设置...')
	try {
		const files = await readSiteFiles(config.siteDir)
		await validatePinnedPostSlugs(files.landing, config.postsDir)
		console.log('   ✅ content/site 必需 YAML、头像和置顶文章 slug 校验通过。')
		return 0
	} catch (error) {
		console.log(
			`   ❌ ${error instanceof Error ? error.message : String(error)}`,
		)
		return 1
	}
}

export async function checkContent(config: CheckConfig = DEFAULT_CONFIG) {
	console.log('🔍 开始检查本地内容...\n')

	try {
		let totalIssues = 0
		let totalSuggestions = 0
		let files: string[] = []

		if (config.scope !== 'site') {
			const postResult = await checkPostsScope(config)
			files = postResult.files
			totalIssues += postResult.totalIssues
			totalSuggestions += postResult.totalSuggestions
		}

		if (config.scope !== 'posts' && config.scope !== 'site') {
			const galleryResult = await checkGalleriesScope(config)
			totalIssues += galleryResult.issues
			totalSuggestions += galleryResult.suggestions
		}

		if (config.scope === 'site' || config.scope === 'all')
			totalIssues += await checkSiteScope(config)

		console.log('📊 检查结果统计:')
		console.log(`   🔍 检查文件: ${files.length}`)
		console.log(`   ⚠️ 发现问题: ${totalIssues}`)
		console.log(`   💡 提供建议: ${totalSuggestions}`)
		if (totalIssues === 0) console.log('\n✅ 所有文件检查通过！')
		else console.log(`\n⚠️ 发现 ${totalIssues} 个问题需要处理`)
		return totalIssues === 0
	} catch (error) {
		console.error('❌ 检查失败:', error)
		return false
	}
}

async function main() {
	const valid = await checkContent(parseContentCliConfig(process.argv.slice(2)))
	if (!valid) process.exitCode = 1
}

if (require.main === module) void main().catch(console.error)
