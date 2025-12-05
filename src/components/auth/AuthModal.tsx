'use client'

import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { useAppStore } from '@/lib/store'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// 登录表单类型
interface LoginForm {
	email: string
	password: string
}

// 注册表单类型
interface RegisterForm {
	username: string
	email: string
	password: string
	confirmPassword: string
}

// 账户信息表单类型
interface ProfileForm {
	username: string
	currentPassword: string
	newPassword: string
	confirmNewPassword: string
}

// 错误消息显示组件
function ErrorMessage({
	message,
	className,
}: {
	message?: string
	className?: string
}) {
	if (!message) return null
	return (
		<p className={cn('text-sm text-destructive mt-1', className)}>{message}</p>
	)
}

// 登录表单组件
function LoginForm() {
	const { login, loading } = useAppStore()
	const [loginError, setLoginError] = useState<string | undefined>(undefined)

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<LoginForm>()

	const onSubmit = async (data: LoginForm) => {
		try {
			setLoginError(undefined)
			await login(data.email, data.password)
			reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登录失败'
			setLoginError(errorMessage)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<InputGroup>
					<InputGroupInput
						type="email"
						placeholder="邮箱地址"
						aria-invalid={!!errors.email}
						{...register('email', {
							required: '请输入邮箱地址',
							pattern: {
								value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
								message: '请输入有效的邮箱地址',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.email?.message || loginError} />
			</div>

			<div>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="密码"
						aria-invalid={!!errors.password}
						{...register('password', {
							required: '请输入密码',
							minLength: {
								value: 6,
								message: '密码长度至少6位',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.password?.message} />
			</div>

			<Button type="submit" className="w-full" disabled={loading.login}>
				{loading.login ? '登录中...' : '登录'}
			</Button>
		</form>
	)
}

// 注册表单组件
function RegisterForm() {
	const { register: registerUser, loading } = useAppStore()
	const [registerError, setRegisterError] = useState<string | undefined>(
		undefined,
	)

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		reset,
	} = useForm<RegisterForm>()

	const password = useWatch({ control, name: 'password' })

	const onSubmit = async (data: RegisterForm) => {
		try {
			setRegisterError(undefined)
			await registerUser(
				data.username,
				data.email,
				data.password,
				data.confirmPassword,
			)
			reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '注册失败'
			setRegisterError(errorMessage)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<InputGroup>
					<InputGroupInput
						type="text"
						placeholder="用户名"
						aria-invalid={!!errors.username}
						{...register('username', {
							required: '请输入用户名',
							minLength: {
								value: 3,
								message: '用户名长度至少3个字符',
							},
							maxLength: {
								value: 20,
								message: '用户名长度不能超过20个字符',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.username?.message} />
			</div>

			<div>
				<InputGroup>
					<InputGroupInput
						type="email"
						placeholder="邮箱地址"
						aria-invalid={!!errors.email}
						{...register('email', {
							required: '请输入邮箱地址',
							pattern: {
								value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
								message: '请输入有效的邮箱地址',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.email?.message || registerError} />
			</div>

			<div>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="密码"
						aria-invalid={!!errors.password}
						{...register('password', {
							required: '请输入密码',
							minLength: {
								value: 6,
								message: '密码长度至少6位',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.password?.message} />
			</div>

			<div>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="确认密码"
						aria-invalid={!!errors.confirmPassword}
						{...register('confirmPassword', {
							required: '请确认密码',
							validate: (value) => value === password || '两次输入的密码不一致',
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.confirmPassword?.message} />
			</div>

			<Button type="submit" className="w-full" disabled={loading.register}>
				{loading.register ? '注册中...' : '注册'}
			</Button>
		</form>
	)
}

// 账户信息编辑表单组件
function ProfileForm() {
	const { updateProfile, loading, user } = useAppStore()
	const [profileError, setProfileError] = useState<string | undefined>(
		undefined,
	)

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
		reset,
	} = useForm<ProfileForm>({
		defaultValues: {
			username: user?.username || '',
		},
	})

	const newPassword = useWatch({ control, name: 'newPassword' })

	const onSubmit = async (data: ProfileForm) => {
		try {
			setProfileError(undefined)
			// 只在有新密码时才传递新密码参数
			const newPasswordValue = data.newPassword || undefined
			await updateProfile(data.username, data.currentPassword, newPasswordValue)
			reset()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : '修改账户信息失败'
			setProfileError(errorMessage)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<div>
				<label className="text-sm font-medium text-gray-700 mb-1 block">
					用户名
				</label>
				<InputGroup>
					<InputGroupInput
						type="text"
						placeholder="用户名"
						aria-invalid={!!errors.username}
						{...register('username', {
							required: '请输入用户名',
							minLength: {
								value: 3,
								message: '用户名长度至少3个字符',
							},
							maxLength: {
								value: 20,
								message: '用户名长度不能超过20个字符',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.username?.message} />
			</div>

			{/* <div>
				<label className="text-sm font-medium text-gray-700 mb-1 block">
					当前密码 <span className="text-red-500">*</span>
				</label>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="请输入当前密码以验证身份"
						aria-invalid={!!errors.currentPassword}
						{...register('currentPassword', {
							required: '请输入当前密码',
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.currentPassword?.message} />
			</div> */}

			<div className="border-t pt-4">
				<label className="text-sm font-medium text-gray-700 mb-1 block">
					新密码（可选）
				</label>
				<p className="text-xs text-gray-500 mb-2">如不需要修改密码，请留空</p>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="新密码（可选）"
						aria-invalid={!!errors.newPassword}
						{...register('newPassword', {
							minLength: {
								value: 6,
								message: '新密码长度至少6位',
							},
						})}
					/>
				</InputGroup>
				<ErrorMessage message={errors.newPassword?.message} />
			</div>

			<div>
				<InputGroup>
					<InputGroupInput
						type="password"
						placeholder="确认新密码"
						aria-invalid={!!errors.confirmNewPassword}
						{...register('confirmNewPassword', {
							validate: (value) =>
								!newPassword ||
								value === newPassword ||
								'两次输入的新密码不一致',
						})}
					/>
				</InputGroup>
				<ErrorMessage
					message={errors.confirmNewPassword?.message || profileError}
				/>
			</div>

			<Button type="submit" className="w-full" disabled={loading.updateProfile}>
				{loading.updateProfile ? '保存中...' : '保存修改'}
			</Button>
		</form>
	)
}

// 主AuthModal组件
export default function AuthModal() {
	const { isAuthModalOpen, authModalView, closeAuthModal, error, user } =
		useAppStore()

	const [activeTab, setActiveTab] = useState(authModalView)

	// 同步modal view变化
	useEffect(() => {
		setActiveTab(authModalView)
	}, [authModalView])

	// 处理Tab切换
	const handleTabChange = (value: string) => {
		setActiveTab(value as 'login' | 'register' | 'profile')
	}

	const isLoggedIn = !!user

	return (
		<Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isLoggedIn ? '账户设置' : '用户认证'}</DialogTitle>
					<DialogDescription>
						{isLoggedIn ? '修改您的用户名和密码' : '登录或注册账户来发表评论'}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm">
						{error}
					</div>
				)}

				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full">
					{!isLoggedIn ? (
						<>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="login">登录</TabsTrigger>
								<TabsTrigger value="register">注册</TabsTrigger>
							</TabsList>

							<TabsContent value="login" className="mt-4">
								<LoginForm />
							</TabsContent>

							<TabsContent value="register" className="mt-4">
								<RegisterForm />
							</TabsContent>
						</>
					) : (
						<TabsContent value="profile" className="mt-4">
							<ProfileForm />
						</TabsContent>
					)}
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
