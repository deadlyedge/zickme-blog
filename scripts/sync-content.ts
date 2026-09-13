import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { db } from '../src/db'
import { posts } from '../src/db/schema'
import { scanLocalContent } from '../src/lib/content-diff'
import {
	shouldWriteBackPoster,
	writeBackPostPoster,
} from '../src/lib/frontmatter-writeback'
import { runSync } from '../src/lib/sync/sync-orchestrator'
import {
	parseSyncScope,
	type SyncRunSummary,
	type SyncScope,
} from '../src/lib/sync/sync-types'

const args = process.argv.slice(2)
const scopeIndex = args.indexOf('--scope')
const requestedScope = scopeIndex >= 0 ? args[scopeIndex + 1] : undefined
const retryIndex = args.indexOf('--retry')
const retryOf = retryIndex >= 0 ? args[retryIndex + 1] : undefined
const dryRun = args.includes('--dry-run')
const json = args.includes('--json')
const deleteOld = !args.includes('--no-delete')

function usage(): never {
	console.error(
		'用法：bun run sync [--scope posts|galleries|all] [--dry-run] [--json] [--no-delete]',
	)
	console.error('未指定 --scope 时默认同步所有内容域（等价于 --scope all）。')
	process.exit(2)
}

function printSummary(summary: SyncRunSummary) {
	if (json) {
		console.log(JSON.stringify(summary))
		return
	}
	console.log(
		`\n=== 同步运行 ${summary.runId}：${summary.status}（scope=${summary.scope}, dry-run=${summary.dryRun}）===`,
	)
	console.log(
		`Post：${summary.posts.succeeded}/${summary.posts.total} 成功，${summary.posts.errors} 错误；` +
			`Gallery：${summary.galleries.processed} 处理，${summary.galleries.uploaded} 上传，` +
			`${summary.galleries.unsupported} unsupported，${summary.galleries.errors} 错误`,
	)
	if (summary.finishedAt) console.log(`完成时间：${summary.finishedAt}`)
}

async function main() {
	console.warn('⚠️ sync 是兼容入口，新的单向发布流程请使用 bun run publish。')
	if (dryRun)
		console.warn(
			'⚠️ 兼容入口 sync 的 dry-run 仅执行只读预览，不写入工作区、数据库、Cloudinary 或 SyncRun。',
		)
	let scope: SyncScope
	try {
		if (retryIndex >= 0 && (!retryOf || retryOf.startsWith('--'))) usage()
		if (retryOf && !requestedScope)
			throw new Error('--retry 必须同时指定 --scope')
		scope = requestedScope ? parseSyncScope(requestedScope) : 'ALL'
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		usage()
	}

	if (!dryRun && (scope === 'POSTS' || scope === 'ALL'))
		await writeBackDatabasePosters()
	const summary = await runSync({
		scope,
		dryRun,
		deleteOld,
		triggeredBy: 'CLI',
		retryOf,
	})
	printSummary(summary)
	if (summary.status === 'FAILED' || summary.status === 'PARTIAL_SUCCESS')
		process.exitCode = 1
}

async function writeBackDatabasePosters() {
	const postsDir = path.join(process.cwd(), 'content/posts')
	const localPosts = await scanLocalContent(postsDir)
	const databasePosts = await db
		.select({
			slug: posts.slug,
			poster: posts.poster,
			updatedAt: posts.updatedAt,
		})
		.from(posts)
	for (const databasePost of databasePosts) {
		if (!databasePost.poster) continue
		const localPost = localPosts.get(databasePost.slug)
		if (!localPost) continue
		try {
			if (
				!(await shouldWriteBackPoster(localPost.path, databasePost.updatedAt))
			)
				continue
			const parsed = matter(await fs.readFile(localPost.path, 'utf8'))
			if (parsed.data.image === databasePost.poster) continue
			await writeBackPostPoster(localPost.path, databasePost.poster)
		} catch {
			// The normal domain sync reports unreadable or missing local files.
		}
	}
}

main().catch((error) => {
	console.error(
		'Fatal sync error:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
