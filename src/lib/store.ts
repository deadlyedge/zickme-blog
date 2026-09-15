import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const isDevelopment = process.env.NODE_ENV === 'development'

// Types
interface AuthState {
	isAuthModalOpen: boolean
	authModalView: 'login' | 'register' | 'profile'
}

interface AuthActions {
	openAuthModal: (view: AuthState['authModalView']) => void
	closeAuthModal: () => void
}

interface CommentState {
	activeReplyId: string | null
}

interface CommentActions {
	setActiveReplyId: (id: string | null) => void
	clearActiveReplyId: () => void
}

type AppState = AuthState & AuthActions & CommentState & CommentActions

// Store implementation
export const useAppStore = create<AppState>()(
	devtools(
		(set) => ({
			// Auth state
			isAuthModalOpen: false,
			authModalView: 'login',

			// Auth actions
			openAuthModal: (view) =>
				set(
					{
						isAuthModalOpen: true,
						authModalView: view,
					},
					false,
					'auth/openModal',
				),

			closeAuthModal: () =>
				set(
					{
						isAuthModalOpen: false,
					},
					false,
					'auth/closeModal',
				),

			// Comment state
			activeReplyId: null,

			// Comment actions
			setActiveReplyId: (id: string | null) =>
				set({ activeReplyId: id }, false, 'comments/setActiveReply'),
			clearActiveReplyId: () =>
				set({ activeReplyId: null }, false, 'comments/clearActiveReply'),
		}),
		{ name: 'app-store', enabled: isDevelopment },
	),
)
