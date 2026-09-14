import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { auditCurrentDocumentation } from '../src/lib/docs/architecture-audit'

async function main(): Promise<void> {
	const root = process.cwd()
	const architectureRoot = path.join(root, 'documents', 'architecture')
	const paths = [
		path.join(root, 'README.md'),
		path.join(root, 'AGENTS.md'),
		path.join(root, 'documents', 'architecture-reduction.md'),
		path.join(architectureRoot, 'README.md'),
		path.join(
			architectureRoot,
			'stage11-deprecated-fields-and-migration-audit.md',
		),
	]
	const files = await Promise.all(
		paths.map(async (filePath) => ({
			name: path.relative(root, filePath),
			content: await fs.readFile(filePath, 'utf8'),
		})),
	)
	const result = auditCurrentDocumentation(files)
	if (!result.valid) {
		console.error('❌ 当前入口文档审计失败：')
		for (const issue of result.issues) console.error(`- ${issue}`)
		process.exitCode = 1
		return
	}
	console.log('✅ 当前入口文档治理语义一致。')
	console.log('仅检查当前入口文档，未扫描历史阶段计划和历史总结。')
}

main().catch((error) => {
	console.error(
		'❌ 文档审计失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
