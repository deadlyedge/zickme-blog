import { runSync } from '../src/lib/sync/sync-orchestrator'

const args = process.argv.slice(2)
const inputIndex = args.indexOf('--input-dir')
const inputDir = inputIndex >= 0 ? args[inputIndex + 1] : undefined

if (inputIndex >= 0 && (!inputDir || inputDir.startsWith('--'))) {
	console.error('错误：--input-dir 需要提供一个目录路径。')
	process.exit(1)
}

if (args.includes('--dry-run'))
	console.warn(
		'⚠️ 兼容入口 sync:galleries 的 dry-run 仅执行只读预览，不写入工作区、数据库、Cloudinary 或 SyncRun。',
	)

runSync({
	scope: 'GALLERIES',
	dryRun: args.includes('--dry-run'),
	galleryInputDir: inputDir,
	deleteOld: args.includes('--delete-old'),
	triggeredBy: 'CLI',
})
	.then((summary) => {
		console.log(JSON.stringify(summary, null, 2))
		if (summary.status !== 'SUCCEEDED') process.exitCode = 1
	})
	.catch((error) => {
		console.error(
			'Gallery 同步失败:',
			error instanceof Error ? error.message : String(error),
		)
		process.exitCode = 1
	})
