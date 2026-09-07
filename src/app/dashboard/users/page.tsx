'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
	ArrowLeft,
	Calendar,
	KeyRound,
	Mail,
	MessageSquare,
	Shield,
	Trash2,
	UserX,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Field, FieldLabel } from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
	deleteComment,
	getUsersList,
	resetUserPasswordByAdmin,
	toggleCommentSpam,
	toggleUserBan,
} from '@/lib/actions/dashboard'

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

	// 重置密码弹窗状态
	const [resetPasswordTargetUser, setResetPasswordTargetUser] =
		useState<User | null>(null)
	const [newPassword, setNewPassword] = useState('')
	const [isResettingPassword, setIsResettingPassword] = useState(false)

	useEffect(() => {
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
		loadUsers()
	}, [])

	const handleToggleBan = async (userId: string, newBanned: boolean) => {
		try {
			setActionLoading(userId)
			await toggleUserBan(userId, newBanned)
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, banned: newBanned } : user,
				),
			)
			toast.success(newBanned ? '用户已封禁' : '用户已解封')
		} catch (error) {
			console.error('Failed to toggle user ban:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleToggleCommentStatus = async (
		commentId: string,
		isSpam: boolean,
	) => {
		try {
			setActionLoading(commentId)
			await toggleCommentSpam(commentId, isSpam)
			setUsers(
				users.map((user) => ({
					...user,
					comments: user.comments.map((comment) =>
						comment.id === commentId
							? { ...comment, status: isSpam ? 'SPAM' : 'PUBLISHED' }
							: comment,
					),
				})),
			)
			toast.success(
				isSpam ? '评论已标记为垃圾信息' : '评论已取消标记为垃圾信息',
			)
		} catch (error) {
			console.error('Failed to toggle comment status:', error)
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

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!resetPasswordTargetUser) return

		if (!newPassword || newPassword.length < 6) {
			toast.error('新密码长度至少需要 6 位')
			return
		}

		try {
			setIsResettingPassword(true)
			const res = await resetUserPasswordByAdmin({
				userId: resetPasswordTargetUser.id,
				newPassword,
			})

			if (res.success) {
				toast.success(`已成功重置用户 [${resetPasswordTargetUser.name}] 的密码`)
				setResetPasswordTargetUser(null)
				setNewPassword('')
			} else {
				toast.error(res.error || '重置密码失败')
			}
		} catch (error) {
			console.error('Failed to reset password:', error)
			toast.error('重置密码失败')
		} finally {
			setIsResettingPassword(false)
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
							<p className="text-muted-foreground">
								管理用户账户、重置密码和审核评论内容
							</p>
						</div>
					</div>
					<Badge variant="secondary" className="text-sm">
						共 {users.length} 个用户
					</Badge>
				</div>

				{/* 用户列表 */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{users.map((user) => (
						<Card
							key={user.id}
							className="w-full flex flex-col justify-between"
						>
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
											<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setResetPasswordTargetUser(user)
												setNewPassword('')
											}}
										>
											<KeyRound className="h-3.5 w-3.5 mr-1" />
											重置密码
										</Button>

										{user.role !== 'ADMIN' && (
											<div className="flex items-center gap-2">
												<Label htmlFor={`ban-${user.id}`} className="text-xs">
													封禁
												</Label>
												<Switch
													id={`ban-${user.id}`}
													checked={user.banned}
													onCheckedChange={(checked) =>
														handleToggleBan(user.id, checked)
													}
													disabled={actionLoading === user.id}
												/>
											</div>
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
										<ScrollArea className="h-60 w-full rounded-md border p-4">
											<div className="space-y-3">
												{user.comments.map((comment) => (
													<div
														key={comment.id}
														className={`p-3 rounded-lg border ${
															comment.status === 'SPAM'
																? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30'
																: comment.status === 'PENDING'
																	? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/30'
																	: 'bg-muted/40'
														}`}
													>
														<div className="flex items-start justify-between gap-3">
															<div className="flex-1 space-y-2">
																<div className="flex items-center gap-2">
																	<Badge
																		variant={getStatusBadgeVariant(
																			comment.status,
																		)}
																		className="text-xs"
																	>
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
																		className="hover:underline text-blue-600"
																	>
																		{comment.post.title}
																	</Link>
																</div>
															</div>
															<div className="flex gap-2 items-center">
																{comment.content !== '[已删除]' && (
																	<>
																		<Label
																			htmlFor={`mark-spam-${comment.id}`}
																			className="text-xs"
																		>
																			Spam
																		</Label>
																		<Switch
																			id={`mark-spam-${comment.id}`}
																			checked={comment.status === 'SPAM'}
																			onCheckedChange={(checked) =>
																				handleToggleCommentStatus(
																					comment.id,
																					checked,
																				)
																			}
																			disabled={actionLoading === comment.id}
																		/>
																		<Dialog>
																			<DialogTrigger asChild>
																				<Button
																					variant="outline"
																					size="sm"
																					disabled={
																						actionLoading === comment.id
																					}
																				>
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
																						className="bg-red-600 hover:bg-red-700"
																					>
																						确认删除
																					</Button>
																				</DialogFooter>
																			</DialogContent>
																		</Dialog>
																	</>
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

				{/* 管理员重置密码 Dialog */}
				<Dialog
					open={Boolean(resetPasswordTargetUser)}
					onOpenChange={(open) => {
						if (!open) {
							setResetPasswordTargetUser(null)
							setNewPassword('')
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>手动重置用户密码</DialogTitle>
							<DialogDescription>
								为用户{' '}
								<span className="font-semibold text-foreground">
									{resetPasswordTargetUser?.name} (
									{resetPasswordTargetUser?.email})
								</span>{' '}
								设置新密码。免邮件系统方案下，设置后请将新密码告知该用户。
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleResetPassword} className="space-y-4">
							<Field>
								<FieldLabel htmlFor="admin-new-password">新密码</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<KeyRound className="size-4" />
									</InputGroupAddon>
									<InputGroupInput
										id="admin-new-password"
										type="password"
										placeholder="请输入至少 6 位新密码"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										autoFocus
										required
										minLength={6}
									/>
								</InputGroup>
							</Field>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setResetPasswordTargetUser(null)
										setNewPassword('')
									}}
								>
									取消
								</Button>
								<Button type="submit" disabled={isResettingPassword}>
									{isResettingPassword ? '重置中...' : '确认重置'}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	)
}
