import { checkContentSafety } from '../src/lib/content/content-safety'
import { runBunScript, runGitCheck } from './content-verify-utils'

async function main() {
	console.log(
		'🧭 content:prepare 默认只执行预览，不写入内容、不提交、不推送、不真实同步。',
	)
	const safetyIssues = await checkContentSafety()
	if (safetyIssues.length > 0) {
		for (const issue of safetyIssues)
			console.error(`❌ ${issue.path}: ${issue.message}`)
		process.exitCode = 1
		return
	}

	const steps = [
		runBunScript(
			['run', 'scripts/check-content.ts', '--no-examples'],
			'内容检查',
		),
		runBunScript(['run', 'scripts/format-content.ts', '--dry-run'], '格式预览'),
		runBunScript(
			['run', 'scripts/gallery-index.ts', '--dry-run'],
			'Gallery 索引预览',
		),
		runBunScript(
			[
				'run',
				'scripts/sync-content.ts',
				'--scope',
				'all',
				'--dry-run',
				'--json',
			],
			'全站同步预览',
		),
		runGitCheck(),
	]
	if (steps.every(Boolean))
		console.log(
			'\n✅ content:prepare 预览通过，可审查 git diff 后手动提交和同步。',
		)
	else process.exitCode = 1
}

main().catch((error) => {
	console.error(
		'❌ 内容准备失败:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
