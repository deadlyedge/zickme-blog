'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	createGalleryImageComment,
	getGalleryImageComments,
} from '@/lib/actions/gallery-image-comments'
import { useSession } from '@/lib/auth-client'

export function GalleryImageComments({ imageId }: { imageId: string }) {
	const pathname = usePathname() || '/'
	const queryClient = useQueryClient()
	const { data: session } = useSession()
	const [content, setContent] = useState('')
	const queryKey = ['gallery-image-comments', imageId]
	const comments = useQuery({
		queryKey,
		queryFn: () => getGalleryImageComments(imageId),
		staleTime: 2 * 60 * 1000,
	})
	const mutation = useMutation({
		mutationFn: () =>
			createGalleryImageComment({ content, imageId, path: pathname }),
		onSuccess: (result) => {
			if (!result.success) {
				toast.error(result.error)
				return
			}
			setContent('')
			void queryClient.invalidateQueries({ queryKey })
			toast.success('评论已发布')
		},
	})

	return (
		<section
			className="mt-5 border-t border-white/10 pt-4"
			aria-label="图片评论"
		>
			<div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-white/55">
				<MessageCircle className="size-3.5" aria-hidden="true" />
				评论
			</div>
			<div className="space-y-3">
				{comments.data?.map((comment) => (
					<div key={comment.id} className="text-sm text-white/75">
						<div className="flex items-center gap-2 text-[10px] text-white/45">
							<span>{comment.author.displayName}</span>
							<span>·</span>
							<time dateTime={comment.createdAt.toISOString()}>
								{formatDistanceToNow(comment.createdAt, { addSuffix: true })}
							</time>
						</div>
						<p className="mt-1 whitespace-pre-wrap leading-6">
							{comment.content}
						</p>
						{comment.replies.length > 0 && (
							<div className="mt-2 space-y-2 border-l border-white/15 pl-3">
								{comment.replies.map((reply) => (
									<div key={reply.id}>
										<div className="text-[10px] text-white/45">
											{reply.author.displayName}
										</div>
										<p className="mt-1 whitespace-pre-wrap leading-6">
											{reply.content}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				))}
				{!comments.isLoading && !comments.data?.length && (
					<p className="text-xs text-white/40">还没有评论。</p>
				)}
			</div>
			{session?.user ? (
				<form
					className="mt-4 flex items-end gap-2"
					onSubmit={(event) => {
						event.preventDefault()
						if (content.trim()) mutation.mutate()
					}}
				>
					<textarea
						value={content}
						onChange={(event) => setContent(event.target.value)}
						placeholder="写下你的评论..."
						maxLength={2000}
						rows={2}
						className="min-h-14 flex-1 resize-none rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/35"
					/>
					<button
						type="submit"
						disabled={mutation.isPending || !content.trim()}
						aria-label="发布评论"
						className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
					>
						<ArrowUp className="size-4" aria-hidden="true" />
					</button>
				</form>
			) : (
				<p className="mt-4 text-xs text-white/45">登录后可以发表评论。</p>
			)}
		</section>
	)
}
