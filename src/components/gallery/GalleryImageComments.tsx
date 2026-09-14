'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { GalleryImageCommentPublic } from '@/lib/actions/gallery-image-comments'
import {
	createGalleryImageComment,
	getGalleryImageComments,
	toggleGalleryImageCommentSpam,
} from '@/lib/actions/gallery-image-comments'
import { useSession } from '@/lib/auth-client'

function CompactCommentForm({
	imageId,
	parentId,
	path,
	onSubmitted,
}: {
	imageId: string
	parentId?: string
	path: string
	onSubmitted: () => void
}) {
	const [content, setContent] = useState('')
	const mutation = useMutation({
		mutationFn: () =>
			createGalleryImageComment({ content, imageId, parentId, path }),
		onSuccess: (result) => {
			if (!result.success) {
				toast.error(result.error)
				return
			}
			setContent('')
			onSubmitted()
			toast.success('评论已发布')
		},
	})
	return (
		<form
			className="mt-2 flex items-end gap-2"
			onSubmit={(event) => {
				event.preventDefault()
				if (content.trim()) mutation.mutate()
			}}
		>
			<textarea
				value={content}
				onChange={(event) => setContent(event.target.value)}
				onKeyDown={(event) => {
					if (
						(event.ctrlKey || event.metaKey) &&
						event.key === 'Enter' &&
						content.trim() &&
						!mutation.isPending
					) {
						event.preventDefault()
						event.currentTarget.form?.requestSubmit()
					}
				}}
				placeholder={parentId ? '回复评论...' : '写下你的评论...'}
				maxLength={2000}
				rows={2}
				className="min-h-12 flex-1 resize-none rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-white/35"
			/>
			<button
				type="submit"
				disabled={mutation.isPending || !content.trim()}
				aria-label={parentId ? '发布回复' : '发布评论'}
				className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"
			>
				<ArrowUp className="size-4" aria-hidden="true" />
			</button>
		</form>
	)
}

function CommentNode({
	comment,
	imageId,
	path,
	isAdmin,
	onRefresh,
}: {
	comment: GalleryImageCommentPublic
	imageId: string
	path: string
	isAdmin: boolean
	onRefresh: () => void
}) {
	const [replying, setReplying] = useState(false)
	const spamMutation = useMutation({
		mutationFn: () =>
			toggleGalleryImageCommentSpam(comment.id, comment.status !== 'SPAM'),
		onSuccess: (result) => {
			if (!result.success) toast.error(result.error)
			else onRefresh()
		},
	})
	return (
		<div className="text-sm text-white/75">
			<div className="flex items-center gap-2 text-[10px] text-white/45">
				<span>{comment.author.displayName}</span>
				<span>·</span>
				<time dateTime={comment.createdAt.toISOString()}>
					{formatDistanceToNow(comment.createdAt, { addSuffix: true })}
				</time>
			</div>
			<p className="mt-1 whitespace-pre-wrap leading-6">{comment.content}</p>
			<div className="mt-1 flex items-center gap-3 text-[10px] text-white/45">
				<button
					type="button"
					onClick={() => setReplying((value) => !value)}
					className="hover:text-white"
				>
					{replying ? '取消回复' : '回复'}
				</button>
				{isAdmin && (
					<button
						type="button"
						disabled={spamMutation.isPending}
						onClick={() => spamMutation.mutate()}
						className="text-red-300/70 hover:text-red-200 disabled:opacity-40"
					>
						{comment.status === 'SPAM' ? '取消垃圾标记' : '标记垃圾'}
					</button>
				)}
			</div>
			{replying && (
				<CompactCommentForm
					imageId={imageId}
					parentId={comment.id}
					path={path}
					onSubmitted={() => {
						setReplying(false)
						onRefresh()
					}}
				/>
			)}
			{comment.replies.length > 0 && (
				<div className="mt-2 space-y-2 border-l border-white/15 pl-3">
					{comment.replies.map((reply) => (
						<CommentNode
							key={reply.id}
							comment={reply}
							imageId={imageId}
							path={path}
							isAdmin={isAdmin}
							onRefresh={onRefresh}
						/>
					))}
				</div>
			)}
		</div>
	)
}

export function GalleryImageComments({ imageId }: { imageId: string }) {
	const pathname = usePathname() || '/'
	const queryClient = useQueryClient()
	const { data: session } = useSession()
	const queryKey = ['gallery-image-comments', imageId]
	const comments = useQuery({
		queryKey,
		queryFn: () => getGalleryImageComments(imageId),
		staleTime: 2 * 60 * 1000,
	})
	const refresh = () => void queryClient.invalidateQueries({ queryKey })
	const isAdmin =
		(session?.user as { role?: string } | undefined)?.role === 'ADMIN'
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
					<CommentNode
						key={comment.id}
						comment={comment}
						imageId={imageId}
						path={pathname}
						isAdmin={isAdmin}
						onRefresh={refresh}
					/>
				))}
				{!comments.isLoading && !comments.data?.length && (
					<p className="text-xs text-white/40">还没有评论。</p>
				)}
			</div>
			{session?.user ? (
				<CompactCommentForm
					imageId={imageId}
					path={pathname}
					onSubmitted={refresh}
				/>
			) : (
				<p className="mt-3 text-xs text-white/45">登录后可以发表评论。</p>
			)}
		</section>
	)
}
