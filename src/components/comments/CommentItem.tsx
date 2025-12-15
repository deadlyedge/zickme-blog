'use client'

import React, { useState } from 'react'
import { CommentWithReplies } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'
import { AnimatePresence, motion } from 'motion/react'
import { toggleCommentSpam } from '@/lib/actions/dashboard'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

interface CommentItemProps {
	comment: CommentWithReplies
	docId: string
	currentUser?: {
		id: string
		name?: string | null
		email?: string
		role?: string
		image?: string | null
	}
	depth: number
}

export const CommentItem = React.memo(
	({ comment, docId, currentUser, depth }: CommentItemProps) => {
		const [isCollapsed, setIsCollapsed] = useState(false)
		const [spamActionLoading, setSpamActionLoading] = useState(false)
		const hasReplies = comment.replies && comment.replies.length > 0

		const { activeReplyId, setActiveReplyId } = useAppStore()
		const isReplying = activeReplyId === comment.id

		const authorName = comment.author?.banned
			? '[已封禁用户]'
			: comment.author?.name || 'Anonymous'

		const handleToggleSpam = async () => {
			try {
				setSpamActionLoading(true)
				const isSpam = comment.status !== 'SPAM'
				await toggleCommentSpam(comment.id, isSpam)
				toast.success(
					isSpam ? '评论已标记为垃圾信息' : '评论已取消标记为垃圾信息',
				)
				// 刷新页面以重新加载评论
				window.location.reload()
			} catch (error) {
				console.error('Failed to toggle spam status:', error)
				toast.error('操作失败')
			} finally {
				setSpamActionLoading(false)
			}
		}

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
								{isCollapsed ? (
									<span className="flex items-center justify-center">
										{`${comment.replies?.length} more`}
										<ChevronRightIcon />
									</span>
								) : (
									<ChevronDownIcon />
								)}
							</button>
						)}
					</header>
					<AnimatePresence>
						{!isCollapsed && (
							<motion.div
								key={isCollapsed ? 'collapsed' : 'expanded'}
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }} // Exit animation definition
								transition={{ duration: 0.3 }}
								className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[0.95rem]">
								{comment.content}

								<div className="flex items-center gap-4 mt-2">
									<button
										onClick={() =>
											setActiveReplyId(isReplying ? null : comment.id)
										}
										className="text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors">
										{isReplying ? 'Cancel' : 'Reply'}
									</button>

									{currentUser?.role === 'ADMIN' && (
										<button
											onClick={handleToggleSpam}
											disabled={spamActionLoading}
											className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors disabled:opacity-50">
											{comment.status === 'SPAM'
												? '取消标记垃圾信息'
												: '标记为垃圾信息'}
										</button>
									)}
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
												autoFocus
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Nested Replies */}
				{!isCollapsed && hasReplies && (
					<div className="relative">
						<CommentList
							comments={comment.replies!}
							docId={docId}
							currentUser={currentUser}
							depth={depth + 1}
						/>
					</div>
				)}
			</div>
		)
	},
)

CommentItem.displayName = 'CommentItem'
