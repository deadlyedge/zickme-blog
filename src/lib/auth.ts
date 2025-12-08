// Server-side auth configuration - only runs on server
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'
import { nextCookies } from 'better-auth/next-js'
import { getGravatarProfile } from '@/lib/getGravatar'

interface SignInContext {
	user: {
		id: string
		email: string
		image?: string | null
		name?: string | null
	}
	account: unknown
	profile?: unknown
}

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
		async onSignIn(context: SignInContext) {
			// 首次登录时同步 Gravatar 头像
			try {
				const { user } = context
				if (user.email && !user.image) {
					const gravatarApiKey = process.env.GRAVATAR_API_KEY
					if (gravatarApiKey) {
						const { avatarUrl } = await getGravatarProfile({
							email: user.email,
						})
						if (avatarUrl) {
							await prisma.user.update({
								where: { id: user.id },
								data: { image: avatarUrl },
							})
						}
					}
				}
				console.log(`[avatar added] ${user.email}`)
			} catch (error: unknown) {
				// 静默失败，不影响登录流程
				const message = error instanceof Error ? error.message : String(error)
				console.log('Gravatar sync skipped:', message)
			}
		},
	},
	// user: {
	// 	fields: {
	// 		name: 'name',
	// 		email: 'email',
	// 		emailVerified: 'emailVerified',
	// 		image: 'image',
	// 	},
	// },
	// account: {
	// 	fields: {
	// 		userId: 'userId',
	// 		providerId: 'providerId',
	// 		accountId: 'accountId',
	// 		password: 'password',
	// 	},
	// },
	// session: {
	// 	fields: {
	// 		userId: 'userId',
	// 		expiresAt: 'expiresAt',
	// 		token: 'token',
	// 		ipAddress: 'ipAddress',
	// 		userAgent: 'userAgent',
	// 	},
	// },
	// verification: {
	// 	fields: {
	// 		identifier: 'identifier',
	// 		value: 'value',
	// 		expiresAt: 'expiresAt',
	// 	},
	// },
	plugins: [nextCookies()], // make sure this is the last plugin in the array
})
