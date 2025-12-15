import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

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
				set({
					isAuthModalOpen: true,
					authModalView: view,
				}),

			closeAuthModal: () =>
				set({
					isAuthModalOpen: false,
				}),

			// Comment state
			activeReplyId: null,

			// Comment actions
			setActiveReplyId: (id: string | null) => set({ activeReplyId: id }),
			clearActiveReplyId: () => set({ activeReplyId: null }),
		}),
		{ name: 'app-store' },
	),
)
