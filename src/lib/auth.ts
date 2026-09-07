// Server-side auth configuration - only runs on server
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
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
