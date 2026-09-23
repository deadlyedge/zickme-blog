'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import type { PostWithTags } from '@/types/content/post'

type PostDeleteDialogProps = {
	post: PostWithTags | null
	isPending: boolean
	onClose: () => void
	onConfirm: () => void
}

export function PostDeleteDialog({
	post,
	isPending,
	onClose,
	onConfirm,
}: PostDeleteDialogProps) {
	return (
		<Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-destructive flex items-center gap-2">
						<AlertTriangle className="h-5 w-5" />
						确认永久删除文章？
					</DialogTitle>
					<DialogDescription>
						您即将彻底删除文章{' '}
						<span className="font-semibold text-foreground">
							[{post?.title}]
						</span>{' '}
						(/{post?.slug})。此操作将直接清理数据库关联记录且不可撤销！
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						取消
					</Button>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={isPending}
					>
						{isPending ? '删除中...' : '确认彻底删除'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
