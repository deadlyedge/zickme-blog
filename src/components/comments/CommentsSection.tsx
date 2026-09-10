'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useSession } from '@/lib/auth-client'
import { useComments } from '@/lib/hooks/useContent'
import { useAppStore } from '@/lib/store'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'

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
					{user ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Link
									href="/user"
									className="flex items-center gap-2"
									// aria-label="进入个人设置与安全"
									// title="进入个人设置与安全"
								>
									<Avatar>
										<AvatarImage
											src={user?.image || 'https://github.com/shadcn.png'}
											alt={user?.name || user?.email || '用户'}
										/>
										<AvatarFallback>
											{user.name?.slice(0, 2).toUpperCase() || 'AN'}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-medium">
										{user.name || user.email || '用户'}
									</span>
								</Link>
							</TooltipTrigger>
							<TooltipContent>进入个人设置与安全</TooltipContent>
						</Tooltip>
					) : (
						<div className="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleLoginClick}
								className="text-xs h-7 px-3"
							>
								登录
							</Button>
							<Button
								size="sm"
								onClick={handleRegisterClick}
								className="text-xs h-7 px-3"
							>
								注册
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* 评论表单区域 */}
			<div className="mb-12">
				{user ? (
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
