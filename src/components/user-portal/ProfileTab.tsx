'use client'

import { Smile, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import type { UserPortalData } from '@/types/user'

interface ProfileTabProps {
	user: UserPortalData['user']
	username: string
	currentPassword: string
	newPassword: string
	confirmPassword: string
	isPending: boolean
	onUsernameChange: (value: string) => void
	onCurrentPasswordChange: (value: string) => void
	onNewPasswordChange: (value: string) => void
	onConfirmPasswordChange: (value: string) => void
	onUpdateProfile: () => void
	onAvatarSwitch: (type: 'dicebear' | 'gravatar') => void
}

export function ProfileTab({
	user,
	username,
	currentPassword,
	newPassword,
	confirmPassword,
	isPending,
	onUsernameChange,
	onCurrentPasswordChange,
	onNewPasswordChange,
	onConfirmPasswordChange,
	onUpdateProfile,
	onAvatarSwitch,
}: ProfileTabProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">基本资料与密码安全</CardTitle>
					<CardDescription>修改用户名或更改您的登录身份凭据</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Field>
						<FieldLabel>昵称 / 用户名</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={username}
								onChange={(event) => onUsernameChange(event.target.value)}
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
									onChange={(event) =>
										onCurrentPasswordChange(event.target.value)
									}
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
									onChange={(event) => onNewPasswordChange(event.target.value)}
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
									onChange={(event) =>
										onConfirmPasswordChange(event.target.value)
									}
									placeholder="再次输入新密码"
								/>
							</InputGroup>
						</Field>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						onClick={onUpdateProfile}
						disabled={isPending}
						className="w-full"
					>
						{isPending ? '保存中...' : '保存个人资料'}
					</Button>
				</CardFooter>
			</Card>

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
							onClick={() => onAvatarSwitch('dicebear')}
							disabled={isPending}
						>
							<Sparkles className="size-4 text-amber-500" />
							<span>重新生成 Dicebear 随机涂鸦角色</span>
						</Button>
						<Button
							variant="outline"
							className="w-full justify-start gap-2 text-xs"
							onClick={() => onAvatarSwitch('gravatar')}
							disabled={isPending}
						>
							<Smile className="size-4 text-blue-500" />
							<span>同步 Gravatar 邮箱官方头像</span>
						</Button>
						<p className="border-t pt-3 text-xs text-muted-foreground">
							Gravatar 会根据你的邮箱匹配头像。没有 Gravatar 头像时，会显示
							identicon 默认图案。{' '}
							<a
								href="https://gravatar.com/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline underline-offset-2"
							>
								前往 Gravatar 管理头像
							</a>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
