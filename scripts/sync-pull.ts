import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { db } from '../src/db'
import { postToMarkdown, safeMarkdownFileName } from '../src/lib/post-exporter'

const postsDir = path.join(process.cwd(), 'content/posts')
const force = process.argv.includes('--force')

async function main() {
	console.warn(
		'⚠️ sync:pull 已废弃：Git 内容源是唯一人工内容源。请使用 Git 历史恢复 Markdown；此兼容入口将在后续阶段移除。',
	)
	await fs.mkdir(postsDir, { recursive: true })
	const remotePosts = await db.query.posts.findMany({
		where: (table, { isNull }) => isNull(table.archivedAt),
		with: { postsToTags: { with: { tag: true } } },
	})
	let pulled = 0
	let skipped = 0
	for (const row of remotePosts) {
		const target = path.join(postsDir, safeMarkdownFileName(row.slug))
		try {
			if (!force) {
				await fs.access(target)
				skipped++
				continue
			}
		} catch {
			// target does not exist
		}
		await fs.writeFile(
			target,
			postToMarkdown({ ...row, tags: row.postsToTags.map((item) => item.tag) }),
			'utf8',
		)
		pulled++
	}
	console.log(
		`同步拉取完成：写入 ${pulled} 篇，跳过 ${skipped} 篇${force ? '（强制模式）' : ''}`,
	)
}

main().catch((error) => {
	console.error('sync:pull 失败:', error)
	process.exit(1)
})
