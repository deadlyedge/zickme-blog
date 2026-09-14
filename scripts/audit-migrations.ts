import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
	auditMigrationChain,
	type MigrationJournalEntry,
} from '../src/lib/db/migration-audit'

type JournalFile = {
	entries?: MigrationJournalEntry[]
}

async function main(): Promise<void> {
	const drizzleRoot = path.join(process.cwd(), 'drizzle')
	const metaPath = path.join(drizzleRoot, 'meta', '_journal.json')
	const entries = await fs.readdir(drizzleRoot, { withFileTypes: true })
	const files = entries
		.filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
		.map((entry) => entry.name)
	const journal = JSON.parse(await fs.readFile(metaPath, 'utf8')) as JournalFile
	const result = auditMigrationChain({
		files,
		journal: journal.entries ?? [],
	})

	console.log(`Migration SQL：${result.fileTags.length} 条`)
	console.log(`Journal entry：${result.journalTags.length} 条`)
	if (!result.valid) {
		console.error('❌ Migration 链审计失败：')
		for (const issue of result.issues) console.error(`- ${issue}`)
		process.exitCode = 1
		return
	}
	console.log('✅ Migration 文件链与 journal 一致。')
	console.log('只读审计未连接数据库，也未执行任何 migration。')
}

main().catch((error) => {
	console.error(
		'❌ Migration 审计失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
