'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db'
import { siteProfile, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { fetchProfile } from '@/lib/content-providers'
import { generateAvatarUri } from '@/lib/generate-avatar'
import { getGravatarProfile } from '@/lib/get-avatar'
import type { Skill, Slogan, SocialLink } from '@/types'

interface UpdateProfileData {
	username: string
	currentPassword?: string
	newPassword?: string
}

export async function updateProfile(data: UpdateProfileData) {
	try {
		const headersList = await headers()
		const session = await auth.api.getSession({
			headers: headersList,
		})

		if (!session?.user?.id) {
			throw new Error('未登录')
		}

		const userId = session.user.id

		// If changing password, verify current password first
		if (data.newPassword && data.currentPassword) {
			const account = await db.query.accounts.findFirst({
				where: (acc, { and, eq }) =>
					and(eq(acc.userId, userId), eq(acc.providerId, 'credential')),
			})

			if (!account?.password) {
				throw new Error('当前用户没有密码记录')
			}

			await auth.api.changePassword({
				body: {
					newPassword: data.newPassword,
					currentPassword: data.currentPassword,
					revokeOtherSessions: true,
				},
				headers: await headers(),
			})
		}
		if (data.username !== session.user.name) {
			await auth.api.updateUser({
				body: {
					name: data.username,
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
		const { avatarUrl } = await getGravatarProfile({
			email: session.user.email,
		})
		const bearAvatar = generateAvatarUri({
			seed: session.user.name,
			variant: 'croodles',
		})

		await db
			.update(users)
			.set({
				image: avatarUrl || bearAvatar,
			})
			.where(eq(users.id, userId))

		return { success: true }
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

		const existingProfile = await db.query.siteProfile.findFirst()

		if (existingProfile) {
			await db
				.update(siteProfile)
				.set({
					name: data.name,
					title: data.title,
					bio: data.bio,
					avatar: data.avatar,
					location: data.location,
					email: data.email,
					website: data.website,
					slogans: data.slogans,
					skills: data.skills,
					socialLinks: data.socialLinks,
					updatedAt: new Date(),
				})
				.where(eq(siteProfile.id, existingProfile.id))
		} else {
			await db.insert(siteProfile).values({
				name: data.name,
				title: data.title,
				bio: data.bio,
				avatar: data.avatar,
				location: data.location,
				email: data.email,
				website: data.website,
				slogans: data.slogans,
				skills: data.skills,
				socialLinks: data.socialLinks,
			})
		}

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
