'use client'

import { useEffect, useState } from 'react'
import {
	getUsersList,
	toggleUserBan,
	markCommentAsSpam,
	deleteComment,
} from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	UserX,
	UserCheck,
	AlertTriangle,
	Trash2,
	MessageSquare,
	Calendar,
	Shield,
	Mail,
	ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

type User = {
	id: string
	name: string
	email: string
	image: string | null
	banned: boolean
	role: string
	emailVerified: boolean
	createdAt: Date
	updatedAt: Date
	totalComments: number
	comments: Array<{
		id: string
		content: string
		status: string
		createdAt: Date
		post: {
			id: string
			title: string
			slug: string
		}
	}>
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [actionLoading, setActionLoading] = useState<string | null>(null)

	useEffect(() => {
		loadUsers()
	}, [])

	const loadUsers = async () => {
		try {
			setLoading(true)
			const usersData = await getUsersList()
			setUsers(usersData)
		} catch (error) {
			console.error('Failed to load users:', error)
			toast.error('加载用户列表失败')
		} finally {
			setLoading(false)
		}
	}

	const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
		try {
			setActionLoading(userId)
			await toggleUserBan(userId, !currentlyBanned)
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, banned: !currentlyBanned } : user,
				),
			)
			toast.success(currentlyBanned ? '用户已解封' : '用户已封禁')
		} catch (error) {
			console.error('Failed to toggle user ban:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleMarkSpam = async (commentId: string) => {
		try {
			setActionLoading(commentId)
			await markCommentAsSpam(commentId)
			setUsers(
				users.map((user) => ({
					...user,
					comments: user.comments.map((comment) =>
						comment.id === commentId ? { ...comment, status: 'SPAM' } : comment,
					),
				})),
			)
			toast.success('评论已标记为垃圾信息')
		} catch (error) {
			console.error('Failed to mark comment as spam:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleDeleteComment = async (commentId: string) => {
		try {
			setActionLoading(commentId)
			await deleteComment(commentId)
			setUsers(
				users.map((user) => ({
					...user,
					comments: user.comments.map((comment) =>
						comment.id === commentId
							? { ...comment, content: '[已删除]' }
							: comment,
					),
				})),
			)
			toast.success('评论已删除')
		} catch (error) {
			console.error('Failed to delete comment:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'SPAM':
				return 'destructive'
			case 'PENDING':
				return 'secondary'
			case 'PUBLISHED':
				return 'default'
			default:
				return 'outline'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'SPAM':
				return '垃圾信息'
			case 'PENDING':
				return '待审核'
			case 'PUBLISHED':
				return '已发布'
			default:
				return status
		}
	}

	if (loading) {
		return (
			<div className="h-svh overflow-y-auto">
				<div className="container mx-auto p-6 pt-24">
					<div className="flex items-center justify-center">
						<div className="text-lg">加载中...</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-6">
				{/* 页面头部 */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/dashboard">
							<Button variant="outline" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								返回仪表板
							</Button>
						</Link>
						<div>
							<h1 className="text-3xl font-bold">用户管理</h1>
							<p className="text-muted-foreground">管理用户账户和评论内容</p>
						</div>
					</div>
					<Badge variant="secondary" className="text-sm">
						共 {users.length} 个用户
					</Badge>
				</div>

				{/* 用户列表 */}
				<div className="flex gap-6">
					{users.map((user) => (
						<Card key={user.id} className="w-full h-128 md:w-1/2">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<Avatar className="h-12 w-12">
											<AvatarImage
												src={user.image || undefined}
												alt={user.name}
											/>
											<AvatarFallback>
												{user.name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<CardTitle className="text-xl">{user.name}</CardTitle>
												{user.role === 'ADMIN' && (
													<Badge variant="destructive" className="text-xs">
														<Shield className="h-3 w-3 mr-1" />
														管理员
													</Badge>
												)}
												{user.banned && (
													<Badge variant="destructive" className="text-xs">
														<UserX className="h-3 w-3 mr-1" />
														已封禁
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Mail className="h-4 w-4" />
													{user.email}
													{user.emailVerified && (
														<Badge variant="outline" className="text-xs ml-1">
															已验证
														</Badge>
													)}
												</div>
												<div className="flex items-center gap-1">
													<Calendar className="h-4 w-4" />
													加入于{' '}
													{formatDistanceToNow(user.createdAt, {
														addSuffix: true,
														locale: zhCN,
													})}
												</div>
												<div className="flex items-center gap-1">
													<MessageSquare className="h-4 w-4" />
													{user.totalComments} 条评论
												</div>
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										{user.role !== 'ADMIN' && (
											<Dialog>
												<DialogTrigger asChild>
													<Button
														variant={user.banned ? 'default' : 'destructive'}
														size="sm"
														disabled={actionLoading === user.id}>
														{user.banned ? (
															<>
																<UserCheck className="h-4 w-4 mr-2" />
																解封用户
															</>
														) : (
															<>
																<UserX className="h-4 w-4 mr-2" />
																封禁用户
															</>
														)}
													</Button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															{user.banned ? '解封用户' : '封禁用户'}
														</DialogTitle>
														<DialogDescription>
															确定要{user.banned ? '解封' : '封禁'}用户 &quot;
															{user.name}&quot; 吗？
															{user.banned
																? '用户将被允许重新登录和发表评论。'
																: '用户将被禁止登录，所有评论将被隐藏。'}
														</DialogDescription>
													</DialogHeader>
													<DialogFooter>
														<DialogClose asChild>
															<Button variant="outline">取消</Button>
														</DialogClose>
														<Button
															onClick={() =>
																handleToggleBan(user.id, user.banned)
															}
															className={
																user.banned
																	? 'bg-green-600 hover:bg-green-700'
																	: ''
															}>
															确认{user.banned ? '解封' : '封禁'}
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										)}
									</div>
								</div>
							</CardHeader>

							{/* 用户评论列表 */}
							{user.comments.length > 0 && (
								<CardContent className="pt-0">
									<div className="space-y-3">
										<h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
											<MessageSquare className="h-4 w-4" />
											最近评论 ({user.comments.length})
										</h4>
										<ScrollArea className="h-80 w-full rounded-md border p-4">
											<div className="space-y-3">
												{user.comments.map((comment) => (
													<div
														key={comment.id}
														className={`p-3 rounded-lg border ${
															comment.status === 'SPAM'
																? 'bg-red-50 border-red-200'
																: comment.status === 'PENDING'
																	? 'bg-yellow-50 border-yellow-200'
																	: 'bg-gray-50'
														}`}>
														<div className="flex items-start justify-between gap-3">
															<div className="flex-1 space-y-2">
																<div className="flex items-center gap-2">
																	<Badge
																		variant={getStatusBadgeVariant(
																			comment.status,
																		)}
																		className="text-xs">
																		{getStatusText(comment.status)}
																	</Badge>
																	<span className="text-xs text-muted-foreground">
																		{formatDistanceToNow(comment.createdAt, {
																			addSuffix: true,
																			locale: zhCN,
																		})}
																	</span>
																</div>
																<p className="text-sm leading-relaxed">
																	{comment.content}
																</p>
																<div className="text-xs text-muted-foreground">
																	文章:{' '}
																	<Link
																		href={`/blog/${comment.post.slug}`}
																		className="hover:underline text-blue-600">
																		{comment.post.title}
																	</Link>
																</div>
															</div>
															<div className="flex gap-1">
																{comment.status !== 'SPAM' &&
																	comment.content !== '[已删除]' && (
																		<Dialog>
																			<DialogTrigger asChild>
																				<Button
																					variant="outline"
																					size="sm"
																					disabled={
																						actionLoading === comment.id
																					}>
																					<AlertTriangle className="h-3 w-3" />
																				</Button>
																			</DialogTrigger>
																			<DialogContent>
																				<DialogHeader>
																					<DialogTitle>
																						标记为垃圾信息
																					</DialogTitle>
																					<DialogDescription>
																						确定要将这条评论标记为垃圾信息吗？标记后将不再公开显示。
																					</DialogDescription>
																				</DialogHeader>
																				<DialogFooter>
																					<DialogClose asChild>
																						<Button
																							variant="outline"
																							onClick={() => {}}>
																							取消
																						</Button>
																					</DialogClose>
																					<Button
																						onClick={() =>
																							handleMarkSpam(comment.id)
																						}>
																						确认标记
																					</Button>
																				</DialogFooter>
																			</DialogContent>
																		</Dialog>
																	)}
																{comment.content !== '[已删除]' && (
																	<Dialog>
																		<DialogTrigger asChild>
																			<Button
																				variant="outline"
																				size="sm"
																				disabled={actionLoading === comment.id}>
																				<Trash2 className="h-3 w-3" />
																			</Button>
																		</DialogTrigger>
																		<DialogContent>
																			<DialogHeader>
																				<DialogTitle>删除评论</DialogTitle>
																				<DialogDescription>
																					确定要删除这条评论吗？删除后将不可恢复。
																				</DialogDescription>
																			</DialogHeader>
																			<DialogFooter>
																				<DialogClose asChild>
																					<Button variant="outline">
																						取消
																					</Button>
																				</DialogClose>
																				<Button
																					onClick={() =>
																						handleDeleteComment(comment.id)
																					}
																					className="bg-red-600 hover:bg-red-700">
																					确认删除
																				</Button>
																			</DialogFooter>
																		</DialogContent>
																	</Dialog>
																)}
															</div>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									</div>
								</CardContent>
							)}
						</Card>
					))}
				</div>

				{users.length === 0 && (
					<Card>
						<CardContent className="flex items-center justify-center py-12">
							<div className="text-center text-muted-foreground">
								<UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>暂无用户数据</p>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
