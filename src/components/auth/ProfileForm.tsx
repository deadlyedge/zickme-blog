'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Key, Lock, User } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { updateProfile } from '@/lib/actions/profile'
import { useSession } from '@/lib/auth-client'
import {
	type AuthFormProps,
	type ProfileFormValues,
	profileSchema,
} from './auth-form-schemas'

// 账户信息编辑表单组件
export function ProfileForm({ onSuccess }: AuthFormProps) {
	const [formError, setFormError] = useState<string | undefined>(undefined)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const session = useSession()
	const user = session.data?.user

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			username: user?.name || '',
			currentPassword: '',
			newPassword: '',
			confirmNewPassword: '',
		},
	})

	// 监听新密码字段的变化，动态显示当前密码字段
	useEffect(() => {
		const subscription = form.watch((value, { name }) => {
			if (name === 'newPassword' || name === 'confirmNewPassword') {
				const newPassword = value.newPassword || ''
				const confirmNewPassword = value.confirmNewPassword || ''
				const shouldShow =
					newPassword.length > 0 || confirmNewPassword.length > 0
				setShowCurrentPassword(shouldShow)
			}
		})
		return () => subscription.unsubscribe()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form.watch])

	const onSubmit = async (data: ProfileFormValues) => {
		try {
			setFormError(undefined)
			setIsSubmitting(true)
			const result = await updateProfile({
				username: data.username,
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
			})
			if (!result.ok) {
				setFormError(result.error)
				return
			}
			onSuccess()
			form.reset()
			setShowCurrentPassword(false)
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
											maxLength={VALIDATION_RULES.password.maxLength}
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
					{showCurrentPassword ? (
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
					) : (
						<p className="text-xs text-muted-foreground mt-2">
							开始输入新密码后，将显示当前密码验证字段
						</p>
					)}
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
