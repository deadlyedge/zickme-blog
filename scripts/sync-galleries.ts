import { syncGalleries } from '../src/lib/gallery/gallery-sync-service'

const args = process.argv.slice(2)
const inputIndex = args.indexOf('--input-dir')
const inputDir = inputIndex >= 0 ? args[inputIndex + 1] : undefined

if (inputIndex >= 0 && (!inputDir || inputDir.startsWith('--'))) {
	console.error('错误：--input-dir 需要提供一个目录路径。')
	process.exit(1)
}

syncGalleries({
	dryRun: args.includes('--dry-run'),
	inputDir,
	deleteOld: args.includes('--delete-old'),
})
	.then((summary) => {
		console.log(JSON.stringify(summary, null, 2))
		if (summary.errors > 0 || summary.unsupported > 0) process.exitCode = 1
	})
	.catch((error) => {
		console.error(
			'Gallery 同步失败:',
			error instanceof Error ? error.message : String(error),
		)
		process.exitCode = 1
	})
