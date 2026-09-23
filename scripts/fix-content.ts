import {
	checkContent,
	DEFAULT_CONFIG,
	parseContentCliConfig,
} from './check-content'

async function main() {
	const config = parseContentCliConfig(process.argv.slice(2))
	const valid = await checkContent({
		...DEFAULT_CONFIG,
		autoFix: true,
		dryRun: config.dryRun,
		showExamples: config.showExamples,
		scope: config.scope,
	})
	if (!valid) process.exitCode = 1
}

void main().catch((error) => {
	console.error('内容修复失败:', error)
	process.exitCode = 1
})
