import crypto from 'crypto'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

interface GravatarProfile {
	display_name: string
	profile_url: string
	avatar_url: string
	avatar_alt_text: string
	location: string
	description: string
	timezone: string
	first_name: string
	last_name: string
	links: Array<unknown>
	interests: Array<unknown>
	contact_info: unknown
	last_profile_edit: string
	registration_date: string
}

interface GetGravatarOptions {
	email?: string
}

export async function getGravatarProfile(options: GetGravatarOptions = {}) {
	try {
		let userEmail = options.email

		// If no email provided, get from current session
		if (!userEmail) {
			const headersList = await headers()
			const session = await auth.api.getSession({
				headers: headersList,
			})

			if (!session?.user?.email) {
				throw new Error('用户未登录或邮箱不存在')
			}

			userEmail = session.user.email
		}

		// Trim and lowercase email for consistency
		const identifier = userEmail.trim().toLowerCase()

		// Create SHA256 hash as per official Gravatar API
		const hash = crypto.createHash('sha256').update(identifier).digest('hex')

		const apiKey = process.env.GRAVATAR_API_KEY
		if (!apiKey) {
			throw new Error('GRAVATAR_API_KEY 环境变量未设置')
		}

		const response = await fetch(
			`https://api.gravatar.com/v3/profiles/${hash}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		)

		const profile: GravatarProfile = await response.json()

		return {
			success: true,
			// profile,
			avatarUrl: profile.avatar_url,
		}
	} catch (error) {
		console.error('获取 Gravatar 资料失败:', error)
		// throw new Error(
		// 	error instanceof Error ? error.message : '获取 Gravatar 资料失败',
		// )
		return {
			success: false,
			error: error instanceof Error ? error.message : '获取 Gravatar 资料失败',
		}
	}
}
