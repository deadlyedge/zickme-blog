'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { siteProfile, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { fetchProfile } from '@/lib/content-providers'
import { generateAvatarUri } from '@/lib/generate-avatar'
import type {
	AboutPageConfig,
	LandingPageConfig,
	Skill,
	Slogan,
	SocialLink,
	ThemeConfig,
} from '@/types'
import { formatZodError } from './types'

const updateProfileSchema = z.object({
	username: z
		.string()
		.trim()
		.min(1, '用户名不能为空')
		.max(50, '用户名长度不能超过50个字符'),
	currentPassword: z.string().min(1).optional(),
	newPassword: z.string().min(6, '新密码长度至少6位').optional(),
})

const updateSiteProfileSchema = z.object({
	name: z.string().trim().min(1, '名称不能为空').max(100),
	title: z.string().trim().max(150),
	bio: z.string().max(2000),
	avatar: z.url('必须是有效图片URL').optional().or(z.literal('')),
	location: z.string().max(100).optional(),
	email: z.email('邮箱格式不正确').optional().or(z.literal('')),
	website: z.url('网址格式不正确').optional().or(z.literal('')),
	slogans: z.array(z.any()).optional(),
	skills: z.array(z.any()).optional(),
	socialLinks: z.array(z.any()).optional(),
	themeConfig: z.record(z.string(), z.any()).optional(),
	landingPageConfig: z.record(z.string(), z.any()).optional(),
	aboutPageConfig: z.record(z.string(), z.any()).optional(),
})

export interface UpdateProfileData {
	username: string
	currentPassword?: string
	newPassword?: string
}

export async function updateProfile(data: UpdateProfileData) {
	try {
		const parsed = updateProfileSchema.safeParse(data)
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id) {
			throw new Error('未登录')
		}

		const userId = session.user.id

		// If changing password, verify current password first
		if (parsed.data.newPassword && parsed.data.currentPassword) {
			const account = await db.query.accounts.findFirst({
				where: (acc, { and, eq }) =>
					and(eq(acc.userId, userId), eq(acc.providerId, 'credential')),
			})

			if (!account?.password) {
				throw new Error('当前用户没有密码记录')
			}

			await auth.api.changePassword({
				body: {
					newPassword: parsed.data.newPassword,
					currentPassword: parsed.data.currentPassword,
					revokeOtherSessions: true,
				},
				headers: await headers(),
			})
		}
		if (parsed.data.username !== session.user.name) {
			await auth.api.updateUser({
				body: {
					name: parsed.data.username,
				},
				headers: await headers(),
			})
		}

		return { success: true }
	} catch (error) {
		console.error('Profile update error:', error)
		throw new Error(error instanceof Error ? error.message : '更新失败')
	}
}

export async function updateAvatar() {
	try {
		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id) {
			throw new Error('未登录')
		}

		const userId = session.user.id
		const bearAvatar = generateAvatarUri({
			seed: session.user.id,
			variant: 'croodles',
		})

		const [updatedUser] = await db
			.update(users)
			.set({ image: bearAvatar })
			.where(and(eq(users.id, userId), isNull(users.image)))
			.returning({ image: users.image })

		return { success: true, avatarUrl: updatedUser?.image ?? bearAvatar }
	} catch (error) {
		console.error('Avatar update error:', error)
		throw new Error(error instanceof Error ? error.message : '更新失败')
	}
}

interface UpdateSiteProfileData {
	name: string
	title: string
	bio: string
	avatar?: string
	location?: string
	email?: string
	website?: string
	slogans?: Slogan[]
	skills?: Skill[]
	socialLinks?: SocialLink[]
	themeConfig?: ThemeConfig
	landingPageConfig?: LandingPageConfig
	aboutPageConfig?: AboutPageConfig
}

export async function updateSiteProfile(data: UpdateSiteProfileData) {
	try {
		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id || session.user.role !== 'ADMIN') {
			throw new Error('需要管理员权限')
		}

		const parsed = updateSiteProfileSchema.safeParse(data)
		if (!parsed.success) {
			throw new Error(formatZodError(parsed.error))
		}

		const existingProfile = await db.query.siteProfile.findFirst()

		if (existingProfile) {
			await db
				.update(siteProfile)
				.set({
					name: parsed.data.name,
					title: parsed.data.title,
					bio: parsed.data.bio,
					avatar: parsed.data.avatar,
					location: parsed.data.location,
					email: parsed.data.email,
					website: parsed.data.website,
					slogans: parsed.data.slogans,
					skills: parsed.data.skills,
					socialLinks: parsed.data.socialLinks,
					themeConfig: parsed.data.themeConfig,
					landingPageConfig: parsed.data.landingPageConfig,
					aboutPageConfig: parsed.data.aboutPageConfig,
					updatedAt: new Date(),
				})
				.where(eq(siteProfile.id, existingProfile.id))
		} else {
			await db.insert(siteProfile).values({
				name: parsed.data.name,
				title: parsed.data.title,
				bio: parsed.data.bio,
				avatar: parsed.data.avatar,
				location: parsed.data.location,
				email: parsed.data.email,
				website: parsed.data.website,
				slogans: parsed.data.slogans,
				skills: parsed.data.skills,
				socialLinks: parsed.data.socialLinks,
				themeConfig: parsed.data.themeConfig,
				landingPageConfig: parsed.data.landingPageConfig,
				aboutPageConfig: parsed.data.aboutPageConfig,
			})
		}

		// Site profile drives the public About page and homepage. Invalidate both
		// routes so the new configuration is visible immediately after saving.
		revalidatePath('/about')
		revalidatePath('/')
		revalidatePath('/dashboard/settings')
		return { success: true }
	} catch (error) {
		console.error('Site profile update error:', error)
		throw new Error(error instanceof Error ? error.message : '更新失败')
	}
}

export async function getSiteProfile() {
	try {
		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id || session.user.role !== 'ADMIN') {
			throw new Error('需要管理员权限')
		}

		const profile = await fetchProfile()

		return { profile }
	} catch (error) {
		console.error('Get site profile error:', error)
		throw new Error(error instanceof Error ? error.message : '获取失败')
	}
}
