import { StateCreator } from 'zustand'
import { AppState, AuthActions, AuthState } from './types'
import { authApi } from '@/lib/auth'

export const createAuthSlice: StateCreator<
	AppState,
	[],
	[],
	AuthState & AuthActions
> = (set, get) => ({
	// 初始状态
	user: null,
	isAuthModalOpen: false,
	authModalView: 'login',
	loading: {
		login: false,
		register: false,
		logout: false,
		updateProfile: false,
	},
	error: null,

	// 用户操作
	login: async (email: string, password: string) => {
		const state = get()
		state.setLoading('login', true)
		state.setError(null)

		try {
			const { user } = await authApi.login(email, password)

			set({
				user,
				error: null,
			})

			// 登录成功后关闭Modal
			state.closeAuthModal()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登录失败'
			state.setError(errorMessage)
			throw error
		} finally {
			state.setLoading('login', false)
		}
	},

	register: async (
		username: string,
		email: string,
		password: string,
		// confirmPassword: string,
	) => {
		const state = get()
		state.setLoading('register', true)
		state.setError(null)

		try {
			const { user } = await authApi.register(username, email, password)

			set({
				user,
				error: null,
			})

			// 注册成功后关闭Modal
			state.closeAuthModal()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '注册失败'
			state.setError(errorMessage)
			throw error
		} finally {
			state.setLoading('register', false)
		}
	},

	logout: async () => {
		const state = get()
		state.setLoading('logout', true)
		state.setError(null)

		try {
			await authApi.logout()

			set({
				user: null,
				error: null,
			})
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '登出失败'
			state.setError(errorMessage)
		} finally {
			state.setLoading('logout', false)
		}
	},

	updateProfile: async (
		username: string,
		currentPassword: string,
		newPassword?: string,
	) => {
		const state = get()
		state.setLoading('updateProfile', true)
		state.setError(null)

		try {
			const currentUser = get().user
			if (!currentUser) {
				throw new Error('用户未登录')
			}

			await authApi.updateProfile(username, currentPassword, newPassword)

			// 更新本地用户信息
			set({
				user: { ...currentUser, username },
				error: null,
			})

			// 修改成功后关闭Modal
			state.closeAuthModal()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : '修改账户信息失败'
			state.setError(errorMessage)
			throw error
		} finally {
			state.setLoading('updateProfile', false)
		}
	},

	checkAuth: async () => {
		try {
			const response = await authApi.getCurrentUser()

			// Payload 的 /me 端点返回 { user: User, ... } 格式
			const user =
				response && typeof response === 'object' && 'user' in response
					? response.user
					: response

			set({
				user,
			})

			return user
		} catch {
			set({
				user: null,
			})
			return null
		}
	},

	// Modal 控制
	openAuthModal: (view: 'login' | 'register' | 'profile') => {
		set({
			isAuthModalOpen: true,
			authModalView: view,
			error: null,
		})
	},

	closeAuthModal: () => {
		set({
			isAuthModalOpen: false,
			error: null,
		})
	},

	// 状态管理
	setError: (error: string | null) => {
		set({ error })
	},

	setLoading: (action: keyof AuthState['loading'], loading: boolean) => {
		set((state) => ({
			loading: {
				...state.loading,
				[action]: loading,
			},
		}))
	},
})
