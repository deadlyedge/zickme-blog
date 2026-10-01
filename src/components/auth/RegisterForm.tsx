'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Key, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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
import { VALIDATION_RULES } from '@/constants/auth'
import { updateAvatar } from '@/lib/actions/profile'
import { signUp } from '@/lib/auth-client'
import {
	type AuthFormProps,
	type RegisterFormValues,
	registerSchema,
} from './auth-form-schemas'

export function RegisterForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			username: '',
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const onSubmit = async (data: RegisterFormValues) => {
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

			// 仅在注册后初始化一次默认头像；后续登录不会覆盖用户选择。
			const avatarResult = await updateAvatar()
			if (!avatarResult.ok) throw new Error(avatarResult.error)

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
									maxLength={VALIDATION_RULES.password.maxLength}
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
									maxLength={VALIDATION_RULES.password.maxLength}
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
