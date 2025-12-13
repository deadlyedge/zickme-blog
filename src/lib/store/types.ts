export interface NavigationState {
	isNavigating: boolean
	currentPath: string
	navigationHistory: string[]
}

export interface NavigationActions {
	setNavigating: (navigating: boolean) => void
	setCurrentPath: (path: string) => void
	addToHistory: (path: string) => void
	navigate: (path: string) => void
}

// Cache types have been removed - all data fetching is now handled by TanStack Query

export interface UIState {
	loadingStates: {
		posts: boolean
		tags: boolean
		pageTransition: boolean
	}
	errorStates: {
		posts: string | null
		tags: string | null
	}
}

export interface UIActions {
	setLoading: (key: keyof UIState['loadingStates'], loading: boolean) => void
	setError: (key: keyof UIState['errorStates'], error: string | null) => void
}

export interface AuthState {
	isAuthModalOpen: boolean
	authModalView: 'login' | 'register' | 'profile'
}

export interface AuthActions {
	openAuthModal: (view: AuthState['authModalView']) => void
	closeAuthModal: () => void
}

export interface CommentState {
	activeReplyId: string | null
}

export interface CommentActions {
	setActiveReplyId: (id: string | null) => void
	clearActiveReplyId: () => void
}

export type AppState = NavigationState &
	NavigationActions &
	UIState &
	UIActions &
	AuthState &
	AuthActions &
	CommentState &
	CommentActions
