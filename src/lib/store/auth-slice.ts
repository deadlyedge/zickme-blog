import { StateCreator } from 'zustand'
import { AppState, AuthActions, AuthState } from './types'

export const createAuthSlice: StateCreator<
	AppState,
	[],
	[],
	AuthState & AuthActions
> = (set) => ({
	isAuthModalOpen: false,
	authModalView: 'login',

	openAuthModal: (view) => {
		set({
			isAuthModalOpen: true,
			authModalView: view,
		})
	},

	closeAuthModal: () => {
		set({
			isAuthModalOpen: false,
		})
	},
})
