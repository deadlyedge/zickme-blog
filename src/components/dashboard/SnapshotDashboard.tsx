'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	createSnapshotAction,
	deleteSnapshotAction,
	restoreSnapshotAction,
} from '@/lib/actions/snapshot-admin'

type SafeSnapshot = {
	id: string
	name: string
	description: string | null
	status: string
	createdAt: string
	completedAt: string | null
	source: string
	summary: { totalRows?: number; includesComments?: boolean } | null
}

export function SnapshotDashboard({
	initialSnapshots,
}: {
	initialSnapshots: SafeSnapshot[]
}) {
	const [snapshots, setSnapshots] = useState(initialSnapshots)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [includeComments, setIncludeComments] = useState(false)
	const [restoreTarget, setRestoreTarget] = useState<SafeSnapshot | null>(null)
	const [confirmText, setConfirmText] = useState('')
	const [pending, startTransition] = useTransition()

	const refreshSnapshot = (snapshot: SafeSnapshot) =>
		setSnapshots((current) => [
			snapshot,
			...current.filter((item) => item.id !== snapshot.id),
		])
	const create = () =>
		startTransition(async () => {
			const result = await createSnapshotAction({
				name,
				description,
				includeComments,
			})
			if (!result.success) {
				toast.error(result.error)
				return
			}
			if (result.snapshot) refreshSnapshot(result.snapshot)
			setName('')
			setDescription('')
			toast.success('数据库快照已创建')
		})
	const remove = (snapshot: SafeSnapshot) =>
		startTransition(async () => {
			const result = await deleteSnapshotAction(snapshot.id)
			if (!result.success) {
				toast.error(result.error)
				return
			}
			setSnapshots((current) =>
				current.filter((item) => item.id !== snapshot.id),
			)
			toast.success('快照已标记为删除')
		})
	const restore = () =>
		startTransition(async () => {
			if (!restoreTarget || confirmText !== restoreTarget.name) {
				toast.error('请输入完整快照名称确认恢复')
				return
			}
			const result = await restoreSnapshotAction({
				snapshotId: restoreTarget.id,
				includeComments,
				confirm: true,
			})
			if (!result.success) {
				toast.error(result.error)
				return
			}
			toast.success('快照已恢复，恢复前保护快照已自动创建')
			setRestoreTarget(null)
			setConfirmText('')
		})

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>创建快照</CardTitle>
					<CardDescription>
						只保存数据库业务副本，不保存认证数据或媒体二进制。
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="snapshot-name">名称</Label>
						<Input
							id="snapshot-name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="发布前备份"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="snapshot-description">说明</Label>
						<Input
							id="snapshot-description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							placeholder="可选"
						/>
					</div>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={includeComments}
							onChange={(event) => setIncludeComments(event.target.checked)}
						/>
						包含评论
					</label>
					<div className="sm:text-right">
						<Button disabled={pending || !name.trim()} onClick={create}>
							创建快照
						</Button>
					</div>
				</CardContent>
			</Card>
			<div className="grid gap-4">
				{snapshots.length === 0 && (
					<Card>
						<CardContent className="py-10 text-center text-sm text-muted-foreground">
							暂无快照
						</CardContent>
					</Card>
				)}
				{snapshots.map((snapshot) => (
					<Card key={snapshot.id}>
						<CardHeader className="flex flex-row items-start justify-between gap-4">
							<div>
								<CardTitle className="text-base">{snapshot.name}</CardTitle>
								<CardDescription>
									{snapshot.description || '无说明'} ·{' '}
									{new Date(snapshot.createdAt).toLocaleString()}
								</CardDescription>
							</div>
							<span className="rounded-full bg-muted px-2 py-1 text-xs">
								{snapshot.source} / {snapshot.status}
							</span>
						</CardHeader>
						<CardContent className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
							<span className="text-muted-foreground">
								{snapshot.summary?.totalRows ?? 0} 行业务数据
								{snapshot.summary?.includesComments ? '，包含评论' : ''}
							</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={
										pending ||
										(snapshot.status !== 'READY' &&
											snapshot.status !== 'RESTORED')
									}
									onClick={() => setRestoreTarget(snapshot)}
								>
									恢复
								</Button>
								<Button
									variant="destructive"
									size="sm"
									disabled={pending || snapshot.source === 'PRE_RESTORE'}
									onClick={() => remove(snapshot)}
								>
									删除
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<Dialog
				open={Boolean(restoreTarget)}
				onOpenChange={(open) => !open && setRestoreTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认恢复数据库快照</DialogTitle>
						<DialogDescription>
							恢复前会自动创建 PRE_RESTORE 保护快照。Markdown、album.yaml 和
							Cloudinary 不会回滚，下一次同步可能覆盖恢复结果。
						</DialogDescription>
					</DialogHeader>
					<Input
						value={confirmText}
						onChange={(event) => setConfirmText(event.target.value)}
						placeholder={restoreTarget?.name}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRestoreTarget(null)}>
							取消
						</Button>
						<Button
							variant="destructive"
							disabled={pending || confirmText !== restoreTarget?.name}
							onClick={restore}
						>
							确认恢复
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
