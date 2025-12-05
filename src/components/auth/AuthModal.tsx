'use client'

import { useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { useAppStore } from '@/lib/store'
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '@/constants'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Mail, Lock, User, Key } from 'lucide-react'

// Zod schemas using constants
const loginSchema = z.object({
	email: z
		.string()
		.regex(VALIDATION_RULES.email.pattern, VALIDATION_MESSAGES.email.invalid),
	password: z
		.string()
		.min(
			VALIDATION_RULES.password.minLength,
			VALIDATION_MESSAGES.password.minLength,
		),
})

const registerSchema = z
	.object({
		username: z
			.string()
			.min(
				VALIDATION_RULES.username.minLength,
				VALIDATION_MESSAGES.username.minLength,
			)
			.max(
				VALIDATION_RULES.username.maxLength,
				VALIDATION_MESSAGES.username.maxLength,
			),
		email: z
			.string()
			.regex(VALIDATION_RULES.email.pattern, VALIDATION_MESSAGES.email.invalid),
		password: z
			.string()
			.min(
				VALIDATION_RULES.password.minLength,
				VALIDATION_MESSAGES.password.minLength,
			),
		confirmPassword: z
			.string()
			.min(1, VALIDATION_MESSAGES.confirmPassword.required),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: VALIDATION_MESSAGES.confirmPassword.mismatch,
		path: ['confirmPassword'],
	})

const profileSchema = z
	.object({
		username: z
			.string()
			.min(
				VALIDATION_RULES.username.minLength,
				VALIDATION_MESSAGES.username.minLength,
			)
			.max(
				VALIDATION_RULES.username.maxLength,
				VALIDATION_MESSAGES.username.maxLength,
			),
		currentPassword: z.string().optional(),
		newPassword: z.string().optional(),
		confirmNewPassword: z.string().optional(),
	})
	.refine(
		(data) => !data.newPassword || data.confirmNewPassword === data.newPassword,
		{
			message: VALIDATION_MESSAGES.newPassword.mismatch,
			path: ['confirmNewPassword'],
		},
	)

// 类型推断
type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type ProfileForm = z.infer<typeof profileSchema>

// 登录表单组件
function LoginForm() {
	const { login, loading } = useAppStore()
	const [loginError, setLoginError] = useState<string | undefined>(undefined)

	const form = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: LoginForm) => {
		try {
			setLoginError(undefined)
			await login(data.email, data.password)
			form.reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登录失败'
			setLoginError(errorMessage)
		}
	}

	return (
		<form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name="email"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="login-email">邮箱地址</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Mail className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="login-email"
									type="email"
									placeholder="邮箱地址"
									aria-invalid={fieldState.invalid}
									autoComplete="email"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="password"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="login-password">密码</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Lock className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="login-password"
									type="password"
									placeholder="密码"
									aria-invalid={fieldState.invalid}
									autoComplete="current-password"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</FieldGroup>
			{loginError && (
				<p className="text-sm text-destructive mt-2">{loginError}</p>
			)}
			<Button type="submit" className="w-full mt-4" disabled={loading.login}>
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

	const form = useForm<RegisterForm>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const onSubmit = async (data: RegisterForm) => {
		try {
			setRegisterError(undefined)
			await registerUser(
				data.username,
				data.email,
				data.password,
				data.confirmPassword,
			)
			form.reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '注册失败'
			setRegisterError(errorMessage)
		}
	}

	return (
		<form id="register-form" onSubmit={form.handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name="username"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="register-username">用户名</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<User className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="register-username"
									type="text"
									placeholder="用户名"
									aria-invalid={fieldState.invalid}
									autoComplete="username"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="email"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="register-email">邮箱地址</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Mail className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="register-email"
									type="email"
									placeholder="邮箱地址"
									aria-invalid={fieldState.invalid}
									autoComplete="email"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="password"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="register-password">密码</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Key className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="register-password"
									type="password"
									placeholder="密码"
									aria-invalid={fieldState.invalid}
									autoComplete="new-password"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				<Controller
					name="confirmPassword"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="register-confirm-password">
								确认密码
							</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Lock className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="register-confirm-password"
									type="password"
									placeholder="确认密码"
									aria-invalid={fieldState.invalid}
									autoComplete="new-password"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
			</FieldGroup>
			{registerError && (
				<p className="text-sm text-destructive mt-2">{registerError}</p>
			)}
			<Button type="submit" className="w-full mt-4" disabled={loading.register}>
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

	const form = useForm<ProfileForm>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			username: user?.username || '',
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	})

	const onSubmit = async (data: ProfileForm) => {
		try {
			setProfileError(undefined)
			const newPasswordValue = data.newPassword || undefined
			await updateProfile(
				data.username,
				data.currentPassword || '',
				newPasswordValue,
			)
			form.reset()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : '修改账户信息失败'
			setProfileError(errorMessage)
		}
	}

	return (
		<form id="profile-form" onSubmit={form.handleSubmit(onSubmit)}>
			<FieldGroup>
				<Controller
					name="username"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="profile-username">用户名</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<User className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="profile-username"
									type="text"
									placeholder="用户名"
									aria-invalid={fieldState.invalid}
									autoComplete="username"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>
				{/* <Controller
					name="currentPassword"
					control={form.control}
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel htmlFor="profile-current-password">当前密码</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<Key className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									{...field}
									id="profile-current-password"
									type="password"
									placeholder="请输入当前密码以验证身份"
									aria-invalid={fieldState.invalid}
									autoComplete="current-password"
								/>
							</InputGroup>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/> */}
				<div className="border-t pt-4">
					<Field>
						<FieldLabel>新密码（可选）</FieldLabel>
						<p className="text-xs text-muted-foreground mb-2">
							如不需要修改密码，请留空
						</p>
						<Controller
							name="newPassword"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<InputGroup>
										<InputGroupAddon>
											<Key className="size-4" />
										</InputGroupAddon>
										<InputGroupInput
											{...field}
											id="profile-new-password"
											type="password"
											placeholder="新密码（可选）"
											aria-invalid={fieldState.invalid}
											autoComplete="new-password"
										/>
									</InputGroup>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</Field>
					<Controller
						name="confirmNewPassword"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="profile-confirm-new-password">
									确认新密码
								</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<Lock className="size-4" />
									</InputGroupAddon>
									<InputGroupInput
										{...field}
										id="profile-confirm-new-password"
										type="password"
										placeholder="确认新密码"
										aria-invalid={fieldState.invalid}
										autoComplete="new-password"
									/>
								</InputGroup>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>
			</FieldGroup>
			{profileError && (
				<p className="text-sm text-destructive mt-2">{profileError}</p>
			)}
			<Button
				type="submit"
				className="w-full mt-4"
				disabled={loading.updateProfile}>
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
