import { spawnSync } from 'node:child_process'
import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { executeRepair, repairCommand } from '../src/lib/publish/publish-repair'
import {
	type ContentIssue,
	type PublishScope,
	parsePublishScope,
} from '../src/lib/publish/publish-types'
import {
	runPublishWorkflow,
	validateForPublish,
} from '../src/lib/publish/publish-workflow'

const args = process.argv.slice(2)
const scopeArg = args.includes('--scope')
	? args[args.indexOf('--scope') + 1]
	: undefined
const forcedDryRun = args.includes('--dry-run')

function printUsage(): void {
	console.log(
		'用法：bun run publish:tui -- [--scope posts|galleries|all] [--dry-run]',
	)
	console.log(
		'交互式检查内容、审查 Git diff、执行 dry-run，并可确认真实 publish。',
	)
}

function printHeader(): void {
	console.log('╭────────────────────────────────────────────╮')
	console.log('│ zick.me Publish Assistant                  │')
	console.log('│ Git-first · Actions paused · Snapshot off  │')
	console.log('╰────────────────────────────────────────────╯')
	console.log(`工作区：${process.cwd()}\n`)
}

function printIssue(issue: ContentIssue, index: number): void {
	console.log(`\n[${index + 1}] [${issue.scope}] ${issue.filePath}`)
	console.log(`${issue.code}\n${issue.message}`)
	if (issue.mediaPath) console.log(`媒体：${issue.mediaPath}`)
	if (issue.suggestedCommand) console.log(`建议命令：${issue.suggestedCommand}`)
	if (issue.reviewFields?.length)
		console.log(`待确认字段：${issue.reviewFields.join('、')}`)
	if (issue.generatedPaths?.length)
		console.log(
			`生成/修改文件：\n${issue.generatedPaths.map((item) => `  ${item}`).join('\n')}`,
		)
	if (issue.generatedDirectories?.length)
		console.log(
			`建议检查目录：\n${issue.generatedDirectories.map((item) => `  ${item}`).join('\n')}`,
		)
}

function openWithCode(target: string): boolean {
	const result = spawnSync('code', ['--reuse-window', target], {
		cwd: process.cwd(),
		stdio: 'inherit',
		windowsHide: true,
	})
	return result.status === 0
}

async function confirm(
	rl: readline.Interface,
	question: string,
): Promise<boolean> {
	const answer = (await rl.question(`${question} [y/N] `)).trim().toLowerCase()
	return answer === 'y' || answer === 'yes'
}

async function reviewIssue(
	rl: readline.Interface,
	issue: ContentIssue,
): Promise<boolean> {
	printIssue(issue, 0)
	if (!issue.canExecuteFromTui || !repairCommand(issue)) {
		console.log('\n该问题需要手动处理。请修改文件后返回 TUI。')
		return confirm(rl, '已完成手动处理并重新检查？')
	}
	if (!(await confirm(rl, '确认执行上述显式修复命令？'))) return false
	const result = executeRepair(issue)
	console.log(
		`\n${result.ok ? '✓' : '✗'} 修复命令${result.ok ? '完成' : '失败'}：${result.command}`,
	)
	if (result.output) console.log(result.output)
	if (!result.ok) return false
	if (
		issue.generatedPaths?.length ||
		issue.generatedDirectories?.length ||
		issue.requiresManualReview
	) {
		console.log('\n需要人工确认：命令成功不代表内容已经完成。')
		for (const target of [
			...(issue.generatedPaths ?? []),
			...(issue.generatedDirectories ?? []),
		])
			console.log(`  ${target}`)
		if (issue.reviewFields?.length)
			console.log(`待填写/检查字段：${issue.reviewFields.join('、')}`)
		if (issue.repairReviewMode === 'review-git-diff') {
			console.log(
				'请查看 Git diff；gallery.yaml 是自动生成文件，不建议手动编辑。',
			)
		} else {
			console.log('建议使用 VS Code 打开文件或目录；也可以手动使用其他编辑器。')
		}
		const target = issue.generatedPaths?.[0] ?? issue.generatedDirectories?.[0]
		if (
			target &&
			issue.repairReviewMode !== 'review-git-diff' &&
			(await confirm(rl, `尝试使用 VS Code 打开 ${target}？`))
		) {
			if (!openWithCode(target))
				console.log('⚠️ VS Code 打开失败，请手动打开上面的路径。')
		}
	}
	return confirm(rl, '已完成编辑并保存，立即重新执行内容检查？')
}

async function printGitReview(): Promise<void> {
	console.log('\nGit 工作区摘要')
	const status = spawnSync('git', ['status', '--short'], { encoding: 'utf8' })
	console.log(status.stdout?.trim() || '  工作区没有变更')
	console.log('\n执行 git diff --check')
	const check = spawnSync('git', ['diff', '--check'], { stdio: 'inherit' })
	if (check.status !== 0) throw new Error('git diff --check 失败')
}

async function main(): Promise<void> {
	if (args.includes('--help') || args.includes('-h')) {
		printUsage()
		return
	}
	if (!input.isTTY || !output.isTTY) {
		console.error(
			'当前环境不是交互式终端。请使用 bun run publish，或在真实终端中运行 bun run publish:tui。',
		)
		process.exitCode = 1
		return
	}
	if (scopeArg?.startsWith('--'))
		throw new Error('--scope 需要提供 posts、galleries 或 all')
	const scope: PublishScope = parsePublishScope(scopeArg)
	printHeader()
	const rl = readline.createInterface({ input, output })
	try {
		console.log(`当前 scope：${scope}`)
		let report = await validateForPublish(scope)
		while (!report.valid) {
			console.log(`\n✗ 内容检查失败：${report.issues.length} 个问题`)
			for (const [index, issue] of report.issues.entries())
				printIssue(issue, index)
			const selected = report.issues[0]
			if (!selected || !(await reviewIssue(rl, selected))) {
				console.log('\n发布已停止。请处理问题后重新运行 TUI。')
				return
			}
			report = await validateForPublish(scope)
		}
		console.log(
			`\n✓ 内容检查通过：${report.checkedFiles} 个 Post，${report.checkedAlbums} 个相册，${report.checkedImages} 张图片`,
		)
		await printGitReview()
		const dry = await runPublishWorkflow({ scope, dryRun: true })
		if (dry.kind !== 'published') throw new Error('dry-run 前内容检查失败')
		console.log(`\n✓ publish dry-run 完成：${dry.summary.status}`)
		if (forcedDryRun) return
		if (!(await confirm(rl, '确认执行真实 publish？'))) {
			console.log('已取消真实 publish。')
			return
		}
		const result = await runPublishWorkflow({ scope, dryRun: false })
		if (result.kind !== 'published')
			throw new Error('真实 publish 前内容检查失败')
		console.log(
			`\n${result.summary.status === 'SUCCEEDED' ? '✓' : '✗'} publish 完成：${result.summary.status}`,
		)
		console.log('内容源未被修改。请按需要审查并提交 Git diff。')
		if (
			result.summary.status === 'FAILED' ||
			result.summary.status === 'PARTIAL_SUCCESS'
		)
			process.exitCode = 1
	} finally {
		rl.close()
	}
}

main().catch((error) => {
	console.error(
		'Publish Assistant 失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
