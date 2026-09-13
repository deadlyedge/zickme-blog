import { runSync } from '../src/lib/sync/sync-orchestrator'
import {
	parseSyncScope,
	type SyncRunSummary,
	type SyncScope,
} from '../src/lib/sync/sync-types'
import { preparePostFrontmatter } from './prepare-post-frontmatter'

const args = process.argv.slice(2)
const scopeIndex = args.indexOf('--scope')
const requestedScope = scopeIndex >= 0 ? args[scopeIndex + 1] : undefined
const dryRun = args.includes('--dry-run')
const json = args.includes('--json')
const deleteOld = !args.includes('--no-delete')

function usage(): never {
	console.error(
		'用法：bun run publish -- [--scope posts|galleries|all] [--dry-run] [--json] [--no-delete]',
	)
	console.error('未指定 --scope 时默认发布所有内容域（等价于 --scope all）。')
	process.exit(2)
}

function printSummary(summary: SyncRunSummary) {
	if (json) {
		console.log(JSON.stringify(summary))
		return
	}
	console.log(
		`\n=== 发布运行 ${summary.runId}：${summary.status}（scope=${summary.scope}, dry-run=${summary.dryRun}）===`,
	)
	console.log(
		`Post：${summary.posts.succeeded}/${summary.posts.total} 成功，${summary.posts.errors} 错误；` +
			`Gallery：${summary.galleries.processed} 处理，${summary.galleries.uploaded} 上传，` +
			`${summary.galleries.unsupported} unsupported，${summary.galleries.errors} 错误`,
	)
	if (summary.finishedAt) console.log(`完成时间：${summary.finishedAt}`)
}

async function main() {
	let scope: SyncScope
	try {
		if (scopeIndex >= 0 && (!requestedScope || requestedScope.startsWith('--')))
			usage()
		scope = requestedScope ? parseSyncScope(requestedScope) : 'ALL'
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		usage()
	}

	if (dryRun)
		console.warn(
			'ℹ️ publish dry-run 仅执行只读预览，不写入工作区、数据库、Cloudinary 或 SyncRun。',
		)

	if (scope === 'POSTS' || scope === 'ALL') {
		console.log('▶ 检查并准备 Post Frontmatter')
		const frontmatter = await preparePostFrontmatter(undefined, dryRun)
		if (frontmatter.changed.length > 0) {
			for (const file of frontmatter.changed)
				console.log(
					`${dryRun ? '🔎 将补齐' : '✅ 已补齐'} Frontmatter：${file}`,
				)
			if (dryRun) {
				console.error(
					'❌ 发布已停止：请确认 Frontmatter 预览后，再运行非 dry-run publish 写入缺失字段。',
				)
				process.exitCode = 1
				return
			}
		}
	}

	const summary = await runSync({
		scope,
		dryRun,
		deleteOld,
		triggeredBy: 'CLI',
	})
	printSummary(summary)
	if (summary.status === 'FAILED' || summary.status === 'PARTIAL_SUCCESS')
		process.exitCode = 1
}

main().catch((error) => {
	console.error(
		'Fatal publish error:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
