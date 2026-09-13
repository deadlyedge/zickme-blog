import { checkContentSafety } from '../src/lib/content/content-safety'
import { runBunScript, runGitCheck } from './content-verify-utils'

async function main() {
	let valid = true
	const safetyIssues = await checkContentSafety()
	if (safetyIssues.length > 0) {
		valid = false
		console.error('❌ 内容安全边界检查失败：')
		for (const issue of safetyIssues)
			console.error(`   ${issue.path}: ${issue.message}`)
	} else {
		console.log('✅ Gallery 原始输入和媒体路径检查通过。')
	}

	valid =
		runBunScript(
			['run', 'scripts/check-content.ts', '--no-examples'],
			'内容检查',
		) && valid
	valid =
		runBunScript(
			['run', 'scripts/format-content.ts', '--dry-run'],
			'内容格式预览',
		) && valid
	valid =
		runBunScript(
			['run', 'scripts/gallery-index.ts', '--dry-run'],
			'Gallery 索引预览',
		) && valid
	valid =
		runBunScript(
			['run', 'scripts/publish.ts', '--scope', 'posts', '--dry-run', '--json'],
			'Post dry-run',
		) && valid
	valid =
		runBunScript(
			[
				'run',
				'scripts/publish.ts',
				'--scope',
				'galleries',
				'--dry-run',
				'--json',
			],
			'Gallery dry-run',
		) && valid
	valid =
		runBunScript(
			['run', 'scripts/publish.ts', '--scope', 'all', '--dry-run', '--json'],
			'全站 dry-run',
		) && valid
	valid = runGitCheck() && valid

	if (!valid) process.exitCode = 1
	else console.log('\n✅ content:verify 全部通过。')
}

main().catch((error) => {
	console.error(
		'❌ 内容验证失败:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
