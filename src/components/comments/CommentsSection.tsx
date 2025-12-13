'use client'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'

import { signOut, useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'
import { useComments } from '@/lib/hooks/useContent'

interface CommentsSectionProps {
	docId: string
}

export function CommentsSection({ docId }: CommentsSectionProps) {
	const { data: comments, isLoading, error } = useComments(docId)
	const openAuthModal = useAppStore((state) => state.openAuthModal)
	const { data: session } = useSession()
	const user = session?.user

	const handleLoginClick = () => {
		openAuthModal('login')
	}

	const handleRegisterClick = () => {
		openAuthModal('register')
	}

	const handleEditProfile = () => {
		openAuthModal('profile')
	}

	const handleLogout = async () => {
		try {
			const result = await signOut()
			if (result.error) {
				console.error('Logout error:', result.error.message || 'Logout failed')
			}
		} catch (error) {
			console.error('Logout error:', error)
		}
	}

	if (isLoading) {
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
				<p className="text-red-500">
					{error.message || 'Failed to load comments'}
				</p>
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
						<div className="flex items-center gap-3">
							<Button
								variant="link"
								onClick={handleEditProfile}
								className="flex items-center gap-2">
								<Avatar>
									<AvatarImage
										src={user?.image || 'https://github.com/shadcn.png'}
										alt={user?.name || user?.email || '用户'}
									/>
									<AvatarFallback>CN</AvatarFallback>
								</Avatar>
								<span className="text-sm font-medium">
									{user.name || user.email || '用户'}
								</span>
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
					<CommentForm docId={docId} />
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

			<CommentList comments={comments || []} docId={docId} currentUser={user} />
		</section>
	)
}
