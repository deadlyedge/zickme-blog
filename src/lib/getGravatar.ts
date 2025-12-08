import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import crypto from 'crypto'

interface GravatarProfile {
	id: string
	hash: string
	requestHash: string
	profileUrl: string
	preferredUsername: string
	thumbnailUrl: string
	photos: Array<{
		value: string
		type: string
	}>
	name?: {
		givenName?: string
		familyName?: string
		formatted?: string
	}
	displayName?: string
	aboutMe?: string
	currentLocation?: string
	emails?: Array<{
		value: string
		primary?: boolean
	}>
	accounts?: Array<{
		domain: string
		display: string
		url: string
		username: string
		verified: boolean
		shortname: string
	}>
	urls?: Array<{
		value: string
		title: string
	}>
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

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error('Gravatar 资料不存在')
			}
			throw new Error(
				`Gravatar API 错误: ${response.status} ${response.statusText}`,
			)
		}

		const profile: GravatarProfile = await response.json()

		console.log('[user profile] ', profile)

		return {
			success: true,
			profile,
			avatarUrl:
				profile.thumbnailUrl || `https://www.gravatar.com/avatar/${hash}?s=200`,
		}
	} catch (error) {
		console.error('获取 Gravatar 资料失败:', error)
		throw new Error(
			error instanceof Error ? error.message : '获取 Gravatar 资料失败',
		)
	}
}

export async function getGravatarUrl(email?: string, size: number = 200) {
	try {
		let userEmail = email

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

		// Trim and lowercase email
		const trimmedEmail = userEmail.toLowerCase().trim()

		// Create MD5 hash for avatar URL (Gravatar uses MD5 for avatar URLs)
		const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex')

		const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=${size}`

		return { success: true, gravatarUrl }
	} catch (error) {
		console.error('获取 Gravatar URL 失败:', error)
		throw new Error(
			error instanceof Error ? error.message : '获取 Gravatar URL 失败',
		)
	}
}
