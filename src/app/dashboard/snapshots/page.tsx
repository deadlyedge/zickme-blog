import { Camera, DatabaseBackup, RefreshCw, Trash2 } from 'lucide-react'
import { SnapshotDashboard } from '@/components/dashboard/SnapshotDashboard'
import { listSnapshotsAction } from '@/lib/actions/snapshot-admin'

export default async function SnapshotsPage() {
	const result = await listSnapshotsAction()
	return (
		<div className="container mx-auto max-w-7xl space-y-6 p-4 py-8 sm:p-6">
			<div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<DatabaseBackup className="size-5 text-primary" />
						<h1 className="text-2xl font-black tracking-tight">数据库快照</h1>
					</div>
					<p className="max-w-2xl text-sm text-muted-foreground">
						快照只保存运行时业务副本，不回滚 Markdown、album.yaml、代码或
						Cloudinary 媒体。
					</p>
				</div>
				<div className="flex gap-2 text-xs text-muted-foreground">
					<span className="inline-flex items-center gap-1">
						<Camera className="size-3.5" />
						业务数据
					</span>
					<span className="inline-flex items-center gap-1">
						<RefreshCw className="size-3.5" />
						可恢复
					</span>
					<span className="inline-flex items-center gap-1">
						<Trash2 className="size-3.5" />
						软删除
					</span>
				</div>
			</div>
			{result.success ? (
				<SnapshotDashboard initialSnapshots={result.snapshots} />
			) : (
				<p className="text-sm text-destructive">{result.error}</p>
			)}
		</div>
	)
}
