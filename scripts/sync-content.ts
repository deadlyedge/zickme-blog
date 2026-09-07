import { ContentSyncService } from '../src/lib/sync-service'

const dryRun = process.argv.includes('--dry-run')
const deleteOld = !process.argv.includes('--no-delete')

async function main() {
	const service = new ContentSyncService()
	const result = await service.runSync({
		triggerType: 'CLI',
		dryRun,
		deleteOld,
	})

	console.log(
		`\n=== 同步结果: ${result.status} (总计: ${result.totalPosts}, 成功: ${result.successCount}, 失败: ${result.errorCount}) ===`,
	)

	for (const log of result.logs) {
		const icon =
			log.level === 'success'
				? '✅'
				: log.level === 'warn'
					? '⚠️'
					: log.level === 'error'
						? '❌'
						: 'ℹ️'
		console.log(`${icon} [${log.stage.toUpperCase()}] ${log.message}`)
		if (log.detail) {
			console.log(`   └─ ${log.detail}`)
		}
	}

	if (!result.success) {
		process.exit(1)
	}
}

main().catch((err) => {
	console.error('Fatal sync error:', err)
	process.exit(1)
})
