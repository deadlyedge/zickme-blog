export default async function SnapshotsPage() {
	return (
		<div className="container mx-auto max-w-3xl p-4 py-8 sm:p-6">
			<div className="rounded-2xl border bg-card p-6 shadow-xs">
				<h1 className="text-2xl font-black tracking-tight">
					数据库快照暂时停用
				</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					Snapshot 页面、Action 和恢复逻辑已暂停。请使用 Git、Neon/数据库备份和
					Cloudinary 原始媒体备份；Snapshot 不是完整站点备份。
				</p>
			</div>
		</div>
	)
}
