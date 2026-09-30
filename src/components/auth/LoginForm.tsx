'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Mail } from 'lucide-react'
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
import { signIn } from '@/lib/auth-client'
import {
	type AuthFormProps,
	type LoginFormValues,
	loginSchema,
} from './auth-form-schemas'

export function LoginForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: LoginFormValues) => {
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
