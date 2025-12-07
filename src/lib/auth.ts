// Client-side auth API - compatibility layer for existing code
// Using better-auth client for proper integration
import { createAuthClient } from 'better-auth/client'

const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : '',
	fetchOptions: {
		onRequest: (context) => {
			return {
				...context,
				headers: {
					...context.headers,
				},
			}
		},
		onResponse: (context) => {
			return context
		},
	},
})

export const authApi = {
	login: async (email: string, password: string) => {
		const result = await authClient.signIn.email({
			email,
			password,
		})

		if (result.error) {
			throw new Error(result.error.message || 'Login failed')
		}

		return { user: result.data?.user }
	},

	register: async (username: string, email: string, password: string) => {
		const result = await authClient.signUp.email({
			email,
			password,
			name: username,
		})

		if (result.error) {
			throw new Error(result.error.message || 'Registration failed')
		}

		return { user: result.data?.user }
	},

	logout: async () => {
		const result = await authClient.signOut()

		if (result.error) {
			throw new Error(result.error.message || 'Logout failed')
		}

		return {}
	},

	updateProfile: async (username: string, currentPassword: string, newPassword?: string) => {
		// Better-auth doesn't have built-in profile update
		// This would need custom implementation
		throw new Error('Profile update not implemented yet')
	},

	getCurrentUser: async () => {
		const result = await authClient.getSession()
		return result.data?.user || null
	},
}
