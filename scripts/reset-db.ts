import { stdin as input, stdout as output } from 'node:process'
import * as readline from 'node:readline/promises'
import { sql } from 'drizzle-orm'
import { db } from '../src/db'

/** Runtime tables owned by the application. Reset never changes schema or migrations. */
export const RESETTABLE_TABLES = [
	'_PostToTag',
	'Comment',
	'GalleryImageComment',
	'GalleryImage',
	'Gallery',
	'Post',
	'tag',
	'siteProfile',
	'SiteSnapshot',
	'SyncLog',
	'SyncRun',
	'session',
	'account',
	'verification',
	'user',
] as const

type ResetTable = (typeof RESETTABLE_TABLES)[number]

function quoteIdentifier(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`
}

function getTargetDescription(): string {
	const rawUrl = process.env.DATABASE_URL
	if (!rawUrl) return 'DATABASE_URL 未配置'
	try {
		const url = new URL(rawUrl)
		return `${url.hostname}${url.port ? `:${url.port}` : ''}/${url.pathname.replace(/^\//, '')}`
	} catch {
		return 'DATABASE_URL 已配置（目标无法解析）'
	}
}

async function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({ input, output })
	try {
		return (await rl.question(question)).trim()
	} finally {
		rl.close()
	}
}

async function readRowCounts(): Promise<Record<ResetTable, number>> {
	const counts = {} as Record<ResetTable, number>
	for (const table of RESETTABLE_TABLES) {
		const result = await db.execute(
			sql.raw(`SELECT count(*)::int AS count FROM ${quoteIdentifier(table)}`),
		)
		const rows = result as unknown as Array<{ count?: number | string }>
		counts[table] = Number(rows[0]?.count ?? 0)
	}
	return counts
}

function totalRows(counts: Record<ResetTable, number>): number {
	return RESETTABLE_TABLES.reduce((total, table) => total + counts[table], 0)
}

export async function resetRuntimeDatabase(): Promise<{
	before: Record<ResetTable, number>
	after: Record<ResetTable, number>
}> {
	const before = await readRowCounts()
	const tableList = RESETTABLE_TABLES.map(quoteIdentifier).join(', ')
	await db.execute(
		sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`),
	)

	const after = await readRowCounts()
	const remaining = RESETTABLE_TABLES.filter((table) => after[table] !== 0)
	if (remaining.length > 0)
		throw new Error(`重置后仍有数据的表：${remaining.join(', ')}`)

	return { before, after }
}

async function main(): Promise<void> {
	const args = new Set(process.argv.slice(2))
	const force = args.has('--force') || args.has('-f')
	const productionConfirmation = args.has('--confirm-production-reset')

	console.log('⚠️  生产数据库完全重置工具')
	console.log(`目标：${getTargetDescription()}`)
	console.log(`将清空 ${RESETTABLE_TABLES.length} 张运行时表中的全部数据。`)
	console.log(
		'只清空运行时数据；不会执行 migration、修改 schema 或删除 migration journal。',
	)
	console.log('不会修改 content/ 文件或删除 Cloudinary 资源。')
	console.log(
		'将永久删除用户、Session、评论、快照、SyncRun/SyncLog 及数据库内容副本。',
	)

	if (!productionConfirmation) {
		console.error('❌ 未提供 --confirm-production-reset，已拒绝执行。')
		console.error('请明确确认这是目标生产数据库，并重新运行：')
		console.error('bun run db:reset -- --confirm-production-reset')
		process.exitCode = 2
		return
	}

	if (!force) {
		const confirmation = await prompt('请输入 RESET PRODUCTION DATABASE 继续：')
		if (confirmation !== 'RESET PRODUCTION DATABASE') {
			console.log('❌ 操作已取消。')
			return
		}
	}

	try {
		const result = await resetRuntimeDatabase()
		console.log(`✅ 数据库重置成功，清理前总行数：${totalRows(result.before)}`)
		console.log(`✅ 清理后总行数：${totalRows(result.after)}`)
		console.log('下一步：运行 bun run publish -- --scope all --no-delete')
	} catch (error) {
		console.error(
			'❌ 数据库重置失败：',
			error instanceof Error ? error.message : String(error),
		)
		process.exitCode = 1
	}
}

if (import.meta.main) await main()
