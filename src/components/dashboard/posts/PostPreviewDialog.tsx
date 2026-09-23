'use client'

import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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

type PostPreviewDialogProps = {
	post: PostWithTags | null
	onClose: () => void
}

export function PostPreviewDialog({ post, onClose }: PostPreviewDialogProps) {
	return (
		<Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl">{post?.title}</DialogTitle>
					<DialogDescription asChild className="space-y-1">
						<div>
							<div>Slug: /{post?.slug}</div>
							{post?.excerpt && <div>摘要: {post.excerpt}</div>}
						</div>
					</DialogDescription>
				</DialogHeader>
				{post?.poster && (
					<div className="relative aspect-video rounded-md overflow-hidden bg-muted border my-2">
						<Image
							src={post.poster}
							alt={post.title}
							fill
							className="object-cover"
							unoptimized
						/>
					</div>
				)}

				<div className="mt-4 p-4 bg-muted/40 rounded border font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
					{post?.content || '(无 Markdown 正文内容)'}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						关闭
					</Button>
					<Button asChild>
						<Link href={`/posts/${post?.slug}`} target="_blank">
							<ExternalLink className="h-4 w-4 mr-2" />
							前往文章详情页
						</Link>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
