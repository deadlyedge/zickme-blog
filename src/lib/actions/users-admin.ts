'use server'

import { hashPassword } from 'better-auth/crypto'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '@/constants/auth'
import { POST_RULES } from '@/constants/post'
import { db } from '@/db'
import { accounts, comments, sessions, users } from '@/db/schema'
import { requireAdminSession } from '@/lib/auth/guards'
import { createLogger } from '@/lib/logger'
import { formatZodError } from './zodError'

const logger = createLogger('actions/dashboard')

const adminResetPasswordSchema = z.object({
	userId: z.string().min(1, '用户ID不能为空').max(POST_RULES.idMaxLength),
	newPassword: z
		.string()
		.min(
			VALIDATION_RULES.password.minLength,
			VALIDATION_MESSAGES.password.minLength,
		)
		.max(
			VALIDATION_RULES.password.maxLength,
			VALIDATION_MESSAGES.password.maxLength,
		),
})

const toggleUserBanSchema = z.object({
	userId: z.string().min(1, '用户ID不能为空').max(POST_RULES.idMaxLength),
	banned: z.boolean(),
})

/** 管理员重置用户密码并撤销该用户的所有现有会话。 */
export async function resetUserPasswordByAdmin(data: {
	userId: string
	newPassword: string
}) {
	try {
		await requireAdminSession()

		const parsed = adminResetPasswordSchema.safeParse(data)
		if (!parsed.success) {
			return {
				success: false,
				error: formatZodError(parsed.error),
			}
		}

		const targetUser = await db.query.users.findFirst({
			where: eq(users.id, parsed.data.userId),
		})

		if (!targetUser) {
			return { success: false, error: '用户不存在' }
		}

		// 使用 Better-Auth 的哈希算法加密密码
		const hashedPassword = await hashPassword(parsed.data.newPassword)

		const credentialAccount = await db.query.accounts.findFirst({
			where: and(
				eq(accounts.userId, targetUser.id),
				eq(accounts.providerId, 'credential'),
			),
		})

		if (credentialAccount) {
			await db
				.update(accounts)
				.set({
					password: hashedPassword,
					updatedAt: new Date(),
				})
				.where(eq(accounts.id, credentialAccount.id))
		} else {
			await db.insert(accounts).values({
				userId: targetUser.id,
				accountId: targetUser.id,
				providerId: 'credential',
				password: hashedPassword,
			})
		}

		// 清理该用户现有的全部登录会话，强制其使用新密码重新登录
		await db.delete(sessions).where(eq(sessions.userId, targetUser.id))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		logger.error('Reset user password by admin error', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '重置密码失败',
		}
	}
}

/** 获取全站用户列表，包括评论和封禁状态。 */
export async function getUsersList() {
	try {
		await requireAdminSession()

		const allUsers = await db.query.users.findMany({
			with: {
				comments: {
					with: {
						post: {
							columns: {
								id: true,
								title: true,
								slug: true,
							},
						},
					},
					orderBy: [desc(comments.createdAt)],
				},
			},
			orderBy: [desc(users.createdAt)],
		})

		return allUsers.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			image: u.image,
			banned: Boolean(u.banned),
			role: u.role || 'USER',
			emailVerified: u.emailVerified,
			createdAt: u.createdAt,
			updatedAt: u.updatedAt,
			totalComments: u.comments?.length || 0,
			comments: (u.comments || []).map((c) => ({
				id: c.id,
				content: c.content,
				status: c.status,
				createdAt: c.createdAt,
				post: {
					id: c.post?.id || '',
					title: c.post?.title || '未知文章',
					slug: c.post?.slug || '',
				},
			})),
		}))
	} catch (error) {
		logger.error('Get users list error', error)
		throw error
	}
}

/** 切换用户封禁状态。 */
export async function toggleUserBan(userId: string, banned: boolean) {
	try {
		await requireAdminSession()

		const parsed = toggleUserBanSchema.safeParse({ userId, banned })
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		await db
			.update(users)
			.set({ banned: parsed.data.banned })
			.where(eq(users.id, parsed.data.userId))

		revalidatePath('/dashboard/users')
		return { success: true }
	} catch (error) {
		logger.error('Toggle user ban error', error)
		throw error
	}
}
