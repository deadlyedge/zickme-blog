'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { getGravatarProfile } from '../getGravatar'
import { generateAvatarUri } from '../avatar'
// import { redirect } from 'next/navigation'

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
			const account = await prisma.account.findFirst({
				where: {
					userId: userId,
					providerId: 'credential', // better-auth uses 'credential' for email/password
				},
			})

			if (!account?.password) {
				throw new Error('当前用户没有密码记录')
			}

			// For better-auth, password verification should be done through the auth system
			// But since we're using server action, we'll need to handle this differently
			// For now, let's update the name and handle password separately
			await auth.api.changePassword({
				body: {
					newPassword: data.newPassword, // required
					currentPassword: data.currentPassword, // required
					revokeOtherSessions: true,
				},
				// This endpoint requires session cookies.
				headers: await headers(),
			})
		}
		if (data.username !== session.user.name) {
			await auth.api.updateUser({
				body: {
					name: data.username,
				},
				// This endpoint requires session cookies.
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

		await prisma.user.update({
			where: { id: userId },
			data: {
				image: avatarUrl || bearAvatar,
			},
		})

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

		// Get the first site profile (assuming there's only one)
		const existingProfile = await prisma.siteProfile.findFirst()

		if (existingProfile) {
			// Update existing profile
			await prisma.siteProfile.update({
				where: { id: existingProfile.id },
				data: {
					name: data.name,
					title: data.title,
					bio: data.bio,
					avatar: data.avatar,
					location: data.location,
					email: data.email,
					website: data.website,
					updatedAt: new Date(),
				},
			})
		} else {
			// Create new profile if none exists
			await prisma.siteProfile.create({
				data: {
					name: data.name,
					title: data.title,
					bio: data.bio,
					avatar: data.avatar,
					location: data.location,
					email: data.email,
					website: data.website,
				},
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

		// Get the first site profile (assuming there's only one)
		const profile = await prisma.siteProfile.findFirst()

		return { profile }
	} catch (error) {
		console.error('Get site profile error:', error)
		throw new Error(error instanceof Error ? error.message : '获取失败')
	}
}
