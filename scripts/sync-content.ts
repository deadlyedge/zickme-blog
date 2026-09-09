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
import { ContentSyncService } from '../src/lib/sync-service'

const dryRun = process.argv.includes('--dry-run')
const deleteOld = !process.argv.includes('--no-delete')

async function main() {
	await writeBackDatabasePosters()
	const service = new ContentSyncService()
	const result = await service.runSync({
		triggerType: 'CLI',
		dryRun,
		deleteOld,
	})

	console.log(
		`\n=== 同步结果: ${result.status} (总计: ${result.totalPosts}, 成功: ${result.successCount}, 失败: ${result.errorCount}) ===`,
	)

	for (const log of result.logs) {
		const icon =
			log.level === 'success'
				? '✅'
				: log.level === 'warn'
					? '⚠️'
					: log.level === 'error'
						? '❌'
						: 'ℹ️'
		console.log(`${icon} [${log.stage.toUpperCase()}] ${log.message}`)
		if (log.detail) {
			console.log(`   └─ ${log.detail}`)
		}
	}

	if (!result.success) {
		process.exit(1)
	}
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
		const filePath = localPost.path
		try {
			if (!(await shouldWriteBackPoster(filePath, databasePost.updatedAt)))
				continue
			const content = await fs.readFile(filePath, 'utf8')
			const parsed = matter(content)
			if (parsed.data.image === databasePost.poster) continue
			await writeBackPostPoster(filePath, databasePost.poster)
			console.log(`↩️ 已将数据库封面回写至本地: ${databasePost.slug}`)
		} catch {
			// 本地文件不存在或不可读时交由正常同步流程处理
		}
	}
}

main().catch((err) => {
	console.error('Fatal sync error:', err)
	process.exit(1)
})
