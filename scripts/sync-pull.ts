async function main() {
	console.warn(
		'❌ sync:pull 已禁用：Git 内容源是唯一人工内容源。请使用 git revert、分支或 tag 恢复 Markdown。',
	)
	process.exitCode = 1
}

main().catch((error) => {
	console.error('sync:pull 失败:', error)
	process.exit(1)
})
