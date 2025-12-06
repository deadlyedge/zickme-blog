'use client'

import { useEffect, useState } from 'react'
import { getComments } from '@/lib/actions/comments'
import { useAppStore } from '@/lib/store'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import { Button } from '@/components/ui/button'
// import { authUtils } from '@/lib/auth'
import type { CommentWithReplies } from '@/lib/actions/comments'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface CommentsSectionProps {
	docId: number
	docType: 'posts' | 'projects'
}

export function CommentsSection({ docId, docType }: CommentsSectionProps) {
	const [comments, setComments] = useState<CommentWithReplies[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const { user, openAuthModal, logout } = useAppStore()

	useEffect(() => {
		async function loadComments() {
			try {
				setLoading(true)
				const commentsData = await getComments(docId, docType)
				setComments(commentsData)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load comments')
			} finally {
				setLoading(false)
			}
		}

		loadComments()
	}, [docId, docType])

	const handleCommentAdded = () => {
		// 重新加载评论
		getComments(docId, docType).then(setComments).catch(console.error)
	}

	const handleLoginClick = () => {
		openAuthModal('login')
	}

	const handleRegisterClick = () => {
		openAuthModal('register')
	}

	const handleLogout = async () => {
		try {
			await logout()
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	const handleEditProfile = () => {
		openAuthModal('profile')
	}

	if (loading) {
		return (
			<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
				<h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
				<div className="animate-pulse space-y-4">
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					<div className="h-4 bg-gray-200 rounded w-2/3"></div>
				</div>
			</section>
		)
	}

	if (error) {
		return (
			<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
				<h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
				<p className="text-red-500">{error}</p>
			</section>
		)
	}

	return (
		<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-2xl font-bold text-slate-900">Comments</h2>

				{/* 认证状态显示 */}
				<div className="flex items-center gap-3">
					{!!user ? (
						<div className="flex items-center gap-2">
							<Button variant="link" onClick={handleEditProfile}>
								<Avatar>
									<AvatarImage
										src={
											user?.profile?.avatar?.url ||
											'https://github.com/shadcn.png'
										}
										alt={user?.username || '@shadcn'}
									/>
									<AvatarFallback>CN</AvatarFallback>
								</Avatar>
								{user.username || '用户'}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="text-xs h-7 px-2">
								登出
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleLoginClick}
								className="text-xs h-7 px-3">
								登录
							</Button>
							<Button
								size="sm"
								onClick={handleRegisterClick}
								className="text-xs h-7 px-3">
								注册
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* 评论表单区域 */}
			<div className="mb-12">
				{!!user ? (
					<CommentForm
						docId={docId}
						docType={docType}
						onSuccess={handleCommentAdded}
					/>
				) : (
					<div className="border border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
						<p className="text-gray-600 mb-4">登录后即可发表评论</p>
						<div className="flex justify-center gap-2">
							<Button onClick={handleLoginClick} variant="outline" size="sm">
								立即登录
							</Button>
							<Button onClick={handleRegisterClick} size="sm">
								创建账户
							</Button>
						</div>
					</div>
				)}
			</div>

			<CommentList comments={comments} docId={docId} docType={docType} />
		</section>
	)
}
