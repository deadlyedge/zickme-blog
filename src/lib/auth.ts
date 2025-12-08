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
		// signIn: async (context: SignInContext) => {
		// 	const { user } = context
		// 	// On sign-in, if user has no image, try to fetch from Gravatar
		// 	if (!user.image) {
		// 		try {
		// 			const { avatarUrl } = await getGravatarProfile({
		// 				email: user.email,
		// 			})
		// 			if (avatarUrl) {
		// 				await prisma.user.update({
		// 					where: { id: user.id },
		// 					data: { image: avatarUrl },
		// 				})
		// 				user.image = avatarUrl
		// 			}
		// 		} catch (error) {
		// 			console.error('Error fetching Gravatar:', error)
		// 		}
		// 	}
		// },
		plugins: [nextCookies()], // make sure this is the last plugin in the array
	},
})
