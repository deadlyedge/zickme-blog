'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
	Calendar,
	KeyRound,
	Mail,
	MessageSquare,
	Shield,
	Trash2,
	UserCheck,
	Users,
	UserX,
} from 'lucide-react'
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
			toast.error('删除评论失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!resetPasswordTargetUser) return

		if (!newPassword || newPassword.length < 6) {
			toast.error('新密码长度不能少于 6 位')
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
			<div className="container mx-auto p-4 sm:p-6 py-8">
				<div className="flex items-center justify-center p-12 text-muted-foreground">
					<div className="text-sm">正在加载用户列表...</div>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-7xl">
			{/* 页面头部 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
						<Users className="h-6 w-6 text-primary" />
						用户与权限管理
					</h1>
					<p className="text-sm text-muted-foreground">
						管理全站注册用户账户、手动重置密码及读者评论内容治理
					</p>
				</div>
				<Badge
					variant="secondary"
					className="text-xs font-mono self-start sm:self-auto"
				>
					共 {users.length} 位注册读者
				</Badge>
			</div>

			{/* 用户列表 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{users.map((user) => (
					<Card
						key={user.id}
						className="w-full flex flex-col justify-between shadow-2xs hover:border-primary/30 transition-colors"
					>
						<CardHeader className="pb-4">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-4 min-w-0">
									<Avatar className="h-12 w-12 shrink-0 ring-1 ring-border">
										<AvatarImage
											src={user.image || undefined}
											alt={user.name}
										/>
										<AvatarFallback>
											{user.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="space-y-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<CardTitle className="text-lg truncate">
												{user.name}
											</CardTitle>
											{user.role === 'ADMIN' && (
												<Badge
													variant="default"
													className="text-[10px] px-1.5 py-0"
												>
													<Shield className="h-3 w-3 mr-1" />
													管理员
												</Badge>
											)}
											{user.banned && (
												<Badge
													variant="destructive"
													className="text-[10px] px-1.5 py-0"
												>
													<UserX className="h-3 w-3 mr-1" />
													已封禁
												</Badge>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
											<div className="flex items-center gap-1 truncate">
												<Mail className="h-3.5 w-3.5 shrink-0" />
												<span className="truncate">{user.email}</span>
											</div>
											<div className="flex items-center gap-1 shrink-0 font-mono">
												<Calendar className="h-3.5 w-3.5" />
												{formatDistanceToNow(new Date(user.createdAt), {
													addSuffix: true,
													locale: zhCN,
												})}
											</div>
										</div>
									</div>
								</div>
								<Badge variant="outline" className="text-xs font-mono shrink-0">
									{user.totalComments} 评论
								</Badge>
							</div>

							{/* 用户操作按钮 */}
							<div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t">
								<div className="flex items-center space-x-2">
									<Switch
										id={`ban-${user.id}`}
										checked={user.banned}
										onCheckedChange={(checked) =>
											handleToggleBan(user.id, checked)
										}
										disabled={actionLoading === user.id}
									/>
									<Label
										htmlFor={`ban-${user.id}`}
										className="text-xs cursor-pointer"
									>
										{user.banned ? '已封禁账户' : '正常状态'}
									</Label>
								</div>

								<Button
									variant="outline"
									size="sm"
									className="text-xs h-8 gap-1.5 shadow-2xs"
									onClick={() => {
										setResetPasswordTargetUser(user)
										setNewPassword('')
									}}
								>
									<KeyRound className="size-3.5 text-primary" />
									重置密码
								</Button>
							</div>
						</CardHeader>

						{/* 用户评论历史 */}
						{user.comments && user.comments.length > 0 && (
							<CardContent className="pt-0">
								<div className="space-y-3">
									<h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
										<MessageSquare className="h-3.5 w-3.5" />
										历史评论记录 ({user.comments.length})
									</h4>
									<ScrollArea className="h-44 rounded-lg border bg-muted/20 p-3">
										<div className="space-y-2.5">
											{user.comments.map((comment) => (
												<div
													key={comment.id}
													className="p-2.5 rounded-lg border bg-background text-xs space-y-1.5 shadow-2xs"
												>
													<div className="flex items-center justify-between gap-2">
														<span className="font-medium text-foreground line-clamp-1">
															《{comment.post.title}》
														</span>
														<Badge
															variant={getStatusBadgeVariant(comment.status)}
															className="text-[9px] px-1 py-0 shrink-0"
														>
															{getStatusText(comment.status)}
														</Badge>
													</div>
													<p className="text-muted-foreground line-clamp-2">
														{comment.content}
													</p>
													<div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
														<span className="font-mono">
															{formatDistanceToNow(
																new Date(comment.createdAt),
																{
																	addSuffix: true,
																	locale: zhCN,
																},
															)}
														</span>
														<div className="flex items-center gap-1">
															{comment.content !== '[已删除]' && (
																<>
																	<Button
																		variant="ghost"
																		size="icon-sm"
																		onClick={() =>
																			handleToggleCommentStatus(
																				comment.id,
																				comment.status !== 'SPAM',
																			)
																		}
																		disabled={actionLoading === comment.id}
																		className="h-6 w-6 text-xs"
																		title={
																			comment.status === 'SPAM'
																				? '取消标记为垃圾评论'
																				: '标记为垃圾评论'
																		}
																	>
																		<UserCheck className="h-3 w-3" />
																	</Button>
																	<Dialog>
																		<DialogTrigger asChild>
																			<Button
																				variant="ghost"
																				size="icon-sm"
																				className="h-6 w-6 text-destructive hover:bg-destructive/10"
																				disabled={actionLoading === comment.id}
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
																					className="bg-destructive hover:bg-destructive/90"
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
	)
}
