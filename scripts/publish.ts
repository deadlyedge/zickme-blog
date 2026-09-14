import {
	type PublishScope,
	parsePublishScope,
} from '../src/lib/publish/publish-types'
import { runPublishWorkflow } from '../src/lib/publish/publish-workflow'

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

function printSummary(
	summary: Awaited<ReturnType<typeof runPublishWorkflow>> extends infer Result
		? Result extends { kind: 'published'; summary: infer Summary }
			? Summary
			: never
		: never,
) {
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
	let scope: PublishScope
	try {
		if (scopeIndex >= 0 && (!requestedScope || requestedScope.startsWith('--')))
			usage()
		scope = parsePublishScope(requestedScope)
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		usage()
	}

	if (dryRun)
		console.warn(
			'ℹ️ publish dry-run 仅执行只读预览，不写入工作区、数据库、Cloudinary 或 SyncRun。',
		)

	const workflow = await runPublishWorkflow({
		scope,
		dryRun,
		deleteOld,
	})
	if (workflow.kind === 'validation') {
		if (json) console.log(JSON.stringify(workflow))
		else {
			console.error(`发布已停止：${scope} 内容检查失败。`)
			for (const issue of workflow.report.issues)
				console.error(
					`[${issue.scope}] ${issue.filePath} ${issue.code}: ${issue.message}`,
				)
			console.error(
				`请按检查结果执行显式修复命令，然后重新运行 bun run publish -- --scope ${scope}`,
			)
		}
		process.exitCode = 1
		return
	}
	printSummary(workflow.summary)
	if (
		workflow.summary.status === 'FAILED' ||
		workflow.summary.status === 'PARTIAL_SUCCESS'
	)
		process.exitCode = 1
}

main().catch((error) => {
	console.error(
		'Fatal publish error:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
