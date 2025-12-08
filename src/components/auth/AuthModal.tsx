'use client'

import { useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { signIn, signUp, useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'
import { VALIDATION_RULES, VALIDATION_MESSAGES } from '@/constants'
import { updateProfile } from '@/lib/actions/profile'
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
type AuthTab = 'login' | 'register' | 'profile'
type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>
type ProfileForm = z.infer<typeof profileSchema>
interface AuthFormProps {
	onSuccess: () => void
}

function LoginForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: LoginForm) => {
		try {
			setFormError(undefined)
			setIsSubmitting(true)
			const result = await signIn.email({
				email: data.email,
				password: data.password,
			})

			if (result.error) {
				throw new Error(result.error.message || '登录失败')
			}

			onSuccess()
			form.reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登录失败'
			setFormError(errorMessage)
		} finally {
			setIsSubmitting(false)
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
			{formError && (
				<p className="text-sm text-destructive mt-2">{formError}</p>
			)}
			<Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
				{isSubmitting ? '登录中...' : '登录'}
			</Button>
		</form>
	)
}

function RegisterForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)

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
			setFormError(undefined)
			setIsSubmitting(true)
			const result = await signUp.email({
				name: data.username,
				email: data.email,
				password: data.password,
			})

			if (result.error) {
				throw new Error(result.error.message || '注册失败')
			}

			onSuccess()
			form.reset()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '注册失败'
			setFormError(errorMessage)
		} finally {
			setIsSubmitting(false)
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
			{formError && (
				<p className="text-sm text-destructive mt-2">{formError}</p>
			)}
			<Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
				{isSubmitting ? '注册中...' : '注册'}
			</Button>
		</form>
	)
}
// 账户信息编辑表单组件
function ProfileForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const session = useSession()
	const user = session.data?.user

	const form = useForm<ProfileForm>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			username: user?.name || '',
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	})

	const onSubmit = async (data: ProfileForm) => {
		try {
			setFormError(undefined)
			setIsSubmitting(true)
			await updateProfile({
				username: data.username,
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			})
			onSuccess()
			form.reset()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : '修改账户信息失败'
			setFormError(errorMessage)
		} finally {
			setIsSubmitting(false)
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
					<Controller
						name="currentPassword"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="profile-current-password">
									当前密码
								</FieldLabel>
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
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>
			</FieldGroup>
			{formError && (
				<p className="text-sm text-destructive mt-2">{formError}</p>
			)}
			<Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
				{isSubmitting ? '保存中...' : '保存修改'}
			</Button>
		</form>
	)
}

export default function AuthModal() {
	const { isAuthModalOpen, authModalView, closeAuthModal } = useAppStore()
	const session = useSession()
	const user = session.data?.user
	const isLoggedIn = Boolean(user)
	const [activeTab, setActiveTab] = useState<AuthTab>(authModalView)

	useEffect(() => {
		setActiveTab(authModalView)
	}, [authModalView])

	const handleTabChange = (value: string) => {
		setActiveTab(value as AuthTab)
	}

	// const handleSignOut = async () => {
	// 	setSignOutError(null)
	// 	setIsSigningOut(true)

	// 	try {
	// 		const result = await signOut()
	// 		if (result.error) {
	// 			throw new Error(result.error.message || '登出失败')
	// 		}
	// 		closeAuthModal()
	// 	} catch (error) {
	// 		setSignOutError(error instanceof Error ? error.message : '登出失败')
	// 	} finally {
	// 		setIsSigningOut(false)
	// 	}
	// }

	return (
		<Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isLoggedIn ? '账户信息' : '用户认证'}</DialogTitle>
					<DialogDescription>
						{isLoggedIn
							? '你已登录，随时在评论区发表想法或管理站点。'
							: '登录或注册账户以发表评论'}
					</DialogDescription>
				</DialogHeader>
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full">
					{isLoggedIn ? (
						<>
							<TabsContent value="profile" className="mt-4">
								<ProfileForm onSuccess={closeAuthModal} />
							</TabsContent>
							{/* 
						<div className="space-y-4">
							<p className="text-sm text-slate-700">
								{user?.name || user?.email}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignOut}
								disabled={isSigningOut}>
								{isSigningOut ? '登出中...' : '登出'}
							</Button>
							{signOutError && (
								<p className="text-sm text-destructive">{signOutError}</p>
							)}
						</div> */}
						</>
					) : (
						<>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="login">登录</TabsTrigger>
								<TabsTrigger value="register">注册</TabsTrigger>
							</TabsList>

							<TabsContent value="login" className="mt-4">
								<LoginForm onSuccess={closeAuthModal} />
							</TabsContent>

							<TabsContent value="register" className="mt-4">
								<RegisterForm onSuccess={closeAuthModal} />
							</TabsContent>
						</>
					)}
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
