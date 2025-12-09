// Server-side auth configuration - only runs on server
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'
import { nextCookies } from 'better-auth/next-js'
// import { getGravatarProfile } from '@/lib/getGravatar'

// interface SignInContext {
// 	user: {
// 		id: string
// 		email: string
// 		image?: string | null
// 		name?: string | null
// 	}
// 	account: unknown
// 	profile?: unknown
// }

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [nextCookies()], // make sure this is the last plugin in the array
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'USER',
				input: false, // 防止用户自己改
			},
		},
	},
})
