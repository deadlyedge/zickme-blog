'use client'

import { Bell, LogOut, MessageSquare, Shield, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommentsTab } from '@/components/user-portal/CommentsTab'
import { ProfileTab } from '@/components/user-portal/ProfileTab'
import { RepliesTab } from '@/components/user-portal/RepliesTab'
import { updateProfile } from '@/lib/actions/profile'
import { updateUserAvatarPreset } from '@/lib/actions/user-portal'
import { signOut } from '@/lib/auth-client'
import type { UserPortalData } from '@/types/user'

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
	const handleAvatarSwitch = (type: 'dicebear' | 'gravatar') => {
		startTransition(async () => {
			try {
				await updateUserAvatarPreset(type)
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
						<ProfileTab
							user={user}
							username={username}
							currentPassword={currentPassword}
							newPassword={newPassword}
							confirmPassword={confirmPassword}
							isPending={isPending}
							onUsernameChange={setUsername}
							onCurrentPasswordChange={setCurrentPassword}
							onNewPasswordChange={setNewPassword}
							onConfirmPasswordChange={setConfirmPassword}
							onUpdateProfile={handleUpdateProfile}
							onAvatarSwitch={handleAvatarSwitch}
						/>
					</TabsContent>

					{/* 2. 我的评论历史 */}
					<TabsContent value="comments" className="space-y-4">
						<CommentsTab comments={comments} />
					</TabsContent>

					{/* 3. 回复我的通知中心 */}
					<TabsContent value="replies" className="space-y-4">
						<RepliesTab replies={repliesToMe} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
