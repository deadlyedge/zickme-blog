'use client'

import { useState } from 'react'
import { type CommentWithReplies } from '@/lib/actions/comments'
import { formatDistanceToNow } from 'date-fns'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'
import { AnimatePresence, motion } from 'motion/react'

interface CommentItemProps {
	comment: CommentWithReplies
	docId: string
	depth: number
}

export function CommentItem({ comment, docId, depth }: CommentItemProps) {
	const [isReplying, setIsReplying] = useState(false)
	const [isCollapsed, setIsCollapsed] = useState(false)
	const hasReplies = comment.replies && comment.replies.length > 0

	const authorName = comment.author?.banned
		? '[已封禁用户]'
		: comment.author?.name || 'Anonymous'

	return (
		<div className={`group relative ${depth > 0 ? 'pl-4 md:pl-8' : ''}`}>
			{/* Thread line for replies */}
			{depth > 0 && (
				<div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 -ml-px" />
			)}

			<div className={`relative ${isCollapsed ? 'opacity-60' : ''}`}>
				<header className="flex items-center gap-2 text-sm mb-2">
					<span className="font-medium text-slate-900">{authorName}</span>
					<span className="text-slate-400 text-xs">•</span>
					<time
						className="text-slate-400 text-xs"
						dateTime={comment.createdAt.toISOString()}>
						{formatDistanceToNow(new Date(comment.createdAt), {
							addSuffix: true,
						})}
					</time>
					{hasReplies && (
						<button
							onClick={() => setIsCollapsed(!isCollapsed)}
							className="ml-auto text-slate-400 hover:text-slate-600 text-xs">
							{isCollapsed ? `[${comment.replies?.length} more]` : '[-]'}
						</button>
					)}
				</header>

				{!isCollapsed && (
					<>
						<div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[0.95rem]">
							{comment.content}
						</div>

						<div className="flex items-center gap-4 mt-2">
							<button
								onClick={() => setIsReplying(!isReplying)}
								className="text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors">
								{isReplying ? 'Cancel' : 'Reply'}
							</button>
						</div>

						<AnimatePresence>
							{isReplying && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className="mt-4 overflow-hidden">
									<CommentForm
										docId={docId}
										parentId={comment.id}
										onSuccess={() => setIsReplying(false)}
										autoFocus
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</>
				)}
			</div>

			{/* Nested Replies */}
			{!isCollapsed && hasReplies && (
				<div className="relative">
					<CommentList
						comments={comment.replies!}
						docId={docId}
						depth={depth + 1}
					/>
				</div>
			)}
		</div>
	)
}
