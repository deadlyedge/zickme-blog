'use client'

import { Pencil } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { PostWithTags } from '@/types/content/post'

type PostPosterDialogProps = {
	post: PostWithTags | null
	posterUrl: string
	posterFile: File | null
	isPending: boolean
	onPosterUrlChange: (value: string) => void
	onPosterFileChange: (file: File | null) => void
	onClose: () => void
	onRemove: () => void
	onSave: () => void
}

export function PostPosterDialog({
	post,
	posterUrl,
	posterFile,
	isPending,
	onPosterUrlChange,
	onPosterFileChange,
	onClose,
	onRemove,
	onSave,
}: PostPosterDialogProps) {
	return (
		<Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Pencil className="h-4 w-4 text-primary" />
						调整文章封面
					</DialogTitle>
					<DialogDescription>
						{post?.title} · 推荐使用 16:9 图片
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					{(posterFile || posterUrl) && (
						<div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
							{posterFile ? (
								<Image
									src={URL.createObjectURL(posterFile)}
									alt="封面预览"
									fill
									unoptimized
									className="object-cover"
								/>
							) : (
								<Image
									src={posterUrl}
									alt="封面预览"
									fill
									unoptimized
									className="object-cover"
								/>
							)}
						</div>
					)}
					<Input
						value={posterUrl}
						onChange={(event) => onPosterUrlChange(event.target.value)}
						placeholder="https://res.cloudinary.com/..."
						disabled={Boolean(posterFile)}
					/>
					<div className="flex items-center gap-2">
						<Input
							type="file"
							accept="image/*"
							onChange={(event) =>
								onPosterFileChange(event.target.files?.[0] || null)
							}
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						上传图片会自动经过 Cloudinary WebP 压缩；留空并保存可移除封面。
					</p>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						取消
					</Button>
					<Button variant="destructive" onClick={onRemove} disabled={isPending}>
						移除封面
					</Button>
					<Button onClick={onSave} disabled={isPending}>
						{isPending ? '保存中...' : '保存封面'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
