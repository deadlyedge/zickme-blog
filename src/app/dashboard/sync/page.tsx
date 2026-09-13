export default function DashboardSyncPage() {
	return (
		<div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6">
			<div className="rounded-2xl border bg-card p-6 shadow-xs">
				<h1 className="text-2xl font-black tracking-tight">旧同步入口已停用</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					内容源由 Git 管理，请修改 Markdown 或 album.yaml，执行 content:check
					后再 publish。 Dashboard 不提供导入、数据库导出、回写、patch、retry
					或冲突处理。
				</p>
			</div>
		</div>
	)
}
