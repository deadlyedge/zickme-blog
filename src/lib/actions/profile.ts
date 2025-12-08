'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
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

		// Update user name
		// await prisma.user.update({
		// 	where: { id: userId },
		// 	data: {
		// 		name: data.username,
		// 	},
		// })

		// TODO: Implement password change through better-auth
		// Password changes require special handling with better-auth
		// For now, only username updates are supported
		if (data.newPassword) {
			console.log('Password change requested but not yet implemented')
		}

		return { success: true }
	} catch (error) {
		console.error('Profile update error:', error)
		throw new Error(error instanceof Error ? error.message : '更新失败')
	}
}
