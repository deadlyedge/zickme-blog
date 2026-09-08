'use client'

import {
	Bell,
	LogOut,
	MessageSquare,
	Shield,
	Smile,
	Sparkles,
	User,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateProfile } from '@/lib/actions/profile'
import {
	type UserPortalData,
	updateUserAvatarPreset,
} from '@/lib/actions/user-portal'
import { signOut } from '@/lib/auth-client'

interface UserPortalClientProps {
	initialData: UserPortalData
}

export function UserPortalClient({ initialData }: UserPortalClientProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [activeTab, setActiveTab] = useState('profile')

	const user = initialData.user
	const comments = initialData.comments
	const repliesToMe = initialData.repliesToMe

	// 个人资料修改状态
	const [username, setUsername] = useState(user.name)
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	// 自定义头像输入
	const [customAvatarUrl, setCustomAvatarUrl] = useState('')

	// 保存个人资料 / 密码
	const handleUpdateProfile = () => {
		if (newPassword && newPassword !== confirmPassword) {
			toast.error('两次输入的新密码不一致')
			return
		}

		if (newPassword && !currentPassword) {
			toast.error('修改密码时必须输入当前密码')
			return
		}

		startTransition(async () => {
			try {
				await updateProfile({
					username,
					currentPassword: currentPassword || undefined,
					newPassword: newPassword || undefined,
				})
				toast.success('个人资料已成功更新！')
				setCurrentPassword('')
				setNewPassword('')
				setConfirmPassword('')
				router.refresh()
			} catch (error) {
				console.error('Update profile error:', error)
				toast.error(error instanceof Error ? error.message : '更新失败')
			}
		})
	}

	// 快速切换头像
	const handleAvatarSwitch = (
		type: 'dicebear' | 'gravatar' | 'custom',
		url?: string,
	) => {
		startTransition(async () => {
			try {
				await updateUserAvatarPreset(type, url)
				toast.success('头像已更新！')
				router.refresh()
			} catch (error) {
				toast.error(error instanceof Error ? error.message : '更新头像失败')
			}
		})
	}

	// 登出
	const handleSignOut = async () => {
		try {
			await signOut()
			toast.success('已安全退出登录')
			router.push('/')
		} catch (_error) {
			toast.error('退出登录失败')
		}
	}

	return (
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-8 max-w-5xl pb-24">
				{/* 用户头部信息看板 */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-card border shadow-xs">
					<div className="flex items-center gap-4">
						<Avatar className="size-16 ring-2 ring-primary/20">
							<AvatarImage src={user.image || ''} alt={user.name} />
							<AvatarFallback className="text-lg font-bold">
								{user.name.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<h1 className="text-xl sm:text-2xl font-bold tracking-tight">
									{user.name}
								</h1>
								<Badge
									variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
									className="text-xs"
								>
									{user.role}
								</Badge>
							</div>
							<p className="text-xs sm:text-sm text-muted-foreground">
								{user.email} • 注册于{' '}
								{new Date(user.createdAt).toLocaleDateString('zh-CN')}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{user.role === 'ADMIN' && (
							<Button asChild variant="outline" size="sm">
								<Link href="/dashboard">
									<Shield className="h-4 w-4 mr-1.5" />
									管理后台
								</Link>
							</Button>
						)}
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSignOut}
							className="text-muted-foreground hover:text-destructive"
						>
							<LogOut className="h-4 w-4 mr-1.5" />
							退出登录
						</Button>
					</div>
				</div>

				{/* 个人中心 Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="w-full space-y-6"
				>
					<TabsList className="grid grid-cols-3 max-w-md">
						<TabsTrigger value="profile" className="gap-2">
							<User className="h-4 w-4" />
							<span>个人资料</span>
						</TabsTrigger>
						<TabsTrigger value="comments" className="gap-2">
							<MessageSquare className="h-4 w-4" />
							<span>我的评论 ({comments.length})</span>
						</TabsTrigger>
						<TabsTrigger value="replies" className="gap-2">
							<Bell className="h-4 w-4" />
							<span>收到的回复 ({repliesToMe.length})</span>
						</TabsTrigger>
					</TabsList>

					{/* 1. 个人资料与安全 */}
					<TabsContent value="profile" className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* 资料与密码 */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">基本资料与密码安全</CardTitle>
									<CardDescription>
										修改用户名或更改您的登录身份凭据
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<Field>
										<FieldLabel>昵称 / 用户名</FieldLabel>
										<InputGroup>
											<InputGroupInput
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												placeholder="输入您的昵称"
											/>
										</InputGroup>
									</Field>

									<Field>
										<FieldLabel>绑定邮箱 (不可更改)</FieldLabel>
										<InputGroup>
											<InputGroupInput
												value={user.email}
												disabled
												className="bg-muted/50 cursor-not-allowed"
											/>
										</InputGroup>
									</Field>

									<div className="pt-2 border-t space-y-3">
										<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
											修改登录密码 (留空则不修改)
										</h4>

										<Field>
											<FieldLabel className="text-xs">当前密码</FieldLabel>
											<InputGroup>
												<InputGroupInput
													type="password"
													value={currentPassword}
													onChange={(e) => setCurrentPassword(e.target.value)}
													placeholder="验证原密码"
												/>
											</InputGroup>
										</Field>

										<Field>
											<FieldLabel className="text-xs">新密码</FieldLabel>
											<InputGroup>
												<InputGroupInput
													type="password"
													value={newPassword}
													onChange={(e) => setNewPassword(e.target.value)}
													placeholder="至少 8 位新密码"
												/>
											</InputGroup>
										</Field>

										<Field>
											<FieldLabel className="text-xs">确认新密码</FieldLabel>
											<InputGroup>
												<InputGroupInput
													type="password"
													value={confirmPassword}
													onChange={(e) => setConfirmPassword(e.target.value)}
													placeholder="再次输入新密码"
												/>
											</InputGroup>
										</Field>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										onClick={handleUpdateProfile}
										disabled={isPending}
										className="w-full"
									>
										{isPending ? '保存中...' : '保存个人资料'}
									</Button>
								</CardFooter>
							</Card>

							{/* 头像生成器面板 */}
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">个性化头像</CardTitle>
									<CardDescription>
										一键切换 Gravatar 全球头像或生成独特的 Dicebear 矢量角色
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-center p-6 bg-muted/20 rounded-2xl border">
										<Avatar className="size-24 ring-4 ring-primary/20 shadow-sm">
											<AvatarImage src={user.image || ''} alt={user.name} />
											<AvatarFallback className="text-2xl font-bold">
												{user.name.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</div>

									<div className="space-y-3">
										<Button
											variant="outline"
											className="w-full justify-start gap-2 text-xs"
											onClick={() => handleAvatarSwitch('dicebear')}
											disabled={isPending}
										>
											<Sparkles className="size-4 text-amber-500" />
											<span>重新生成 Dicebear 随机涂鸦角色</span>
										</Button>

										<Button
											variant="outline"
											className="w-full justify-start gap-2 text-xs"
											onClick={() => handleAvatarSwitch('gravatar')}
											disabled={isPending}
										>
											<Smile className="size-4 text-blue-500" />
											<span>同步 Gravatar 邮箱官方头像</span>
										</Button>

										<div className="pt-2 border-t space-y-2">
											<FieldLabel className="text-xs">
												自定义外链头像
											</FieldLabel>
											<div className="flex gap-2">
												<InputGroup className="flex-1">
													<InputGroupInput
														value={customAvatarUrl}
														onChange={(e) => setCustomAvatarUrl(e.target.value)}
														placeholder="https://..."
														className="text-xs"
													/>
												</InputGroup>
												<Button
													size="sm"
													variant="secondary"
													onClick={() =>
														handleAvatarSwitch('custom', customAvatarUrl)
													}
													disabled={isPending || !customAvatarUrl}
												>
													应用
												</Button>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* 2. 我的评论历史 */}
					<TabsContent value="comments" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">我的评论历史</CardTitle>
								<CardDescription>
									您在全站发表的所有文章评论与互动记录
								</CardDescription>
							</CardHeader>
							<CardContent>
								{comments.length === 0 ? (
									<div className="py-12 text-center text-muted-foreground text-sm">
										您还没有发表过任何评论。去文章页面留下您的想法吧！
									</div>
								) : (
									<div className="space-y-4">
										{comments.map((comment) => (
											<div
												key={comment.id}
												className="p-4 rounded-xl border bg-muted/20 space-y-2 hover:border-primary/40 transition-colors"
											>
												<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
													<Link
														href={`/posts/${comment.postSlug}`}
														className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
													>
														《{comment.postTitle}》
													</Link>
													<span>
														{new Date(comment.createdAt).toLocaleString(
															'zh-CN',
														)}
													</span>
												</div>

												<p className="text-sm text-foreground/90 leading-relaxed">
													{comment.content}
												</p>

												{comment.parentAuthorName && (
													<div className="text-xs text-muted-foreground bg-background/60 p-2 rounded-lg border">
														回复了 @{comment.parentAuthorName} 的评论
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					{/* 3. 回复我的通知中心 */}
					<TabsContent value="replies" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">回复通知 (Reply Hub)</CardTitle>
								<CardDescription>
									其他读者或管理员对您的评论发表的回复
								</CardDescription>
							</CardHeader>
							<CardContent>
								{repliesToMe.length === 0 ? (
									<div className="py-12 text-center text-muted-foreground text-sm">
										暂无收到的回复。
									</div>
								) : (
									<div className="space-y-4">
										{repliesToMe.map((reply) => (
											<div
												key={reply.id}
												className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-3"
											>
												<div className="flex items-center justify-between gap-2 text-xs">
													<div className="flex items-center gap-2">
														<Avatar className="size-6">
															<AvatarImage
																src={reply.replyAuthor.image || ''}
															/>
															<AvatarFallback>
																{reply.replyAuthor.name.slice(0, 2)}
															</AvatarFallback>
														</Avatar>
														<span className="font-bold text-foreground">
															{reply.replyAuthor.name}
														</span>
														<span className="text-muted-foreground">
															回复了您
														</span>
													</div>
													<span className="text-muted-foreground">
														{new Date(reply.createdAt).toLocaleString('zh-CN')}
													</span>
												</div>

												<div className="text-xs text-muted-foreground bg-background p-2 rounded-lg border line-clamp-2">
													您的原始评论: "{reply.originalCommentContent}"
												</div>

												<p className="text-sm font-medium text-foreground">
													{reply.content}
												</p>

												<div className="flex justify-end pt-1">
													<Button size="sm" variant="outline" asChild>
														<Link
															href={`/posts/${reply.postSlug}#comments`}
															className="text-xs"
														>
															前往文章查看
														</Link>
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
