import * as z from 'zod'
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '@/constants/auth'

// Zod schemas using constants
export const loginSchema = z.object({
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

export const registerSchema = z
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

export const profileSchema = z
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
		currentPassword: z.string(),
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
	.refine(
		(data) =>
			(!data.newPassword && !data.confirmNewPassword) || data.currentPassword,
		{
			message: '修改密码时必须输入当前密码',
			path: ['currentPassword'],
		},
	)

// 类型推断
export type AuthTab = 'login' | 'register' | 'profile'
export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>

export interface AuthFormProps {
	onSuccess: () => void
}
