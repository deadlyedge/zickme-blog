import type { PostType, Tag } from '@/generated/prisma/client'
import { PostWithTags } from '../content-providers'

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

export interface CacheState {
	// 列表数据
	posts: Map<string, PostWithTags>
	tags: Tag[]

	// 单篇内容数据 - 按 slug 缓存
	singlePosts: Map<string, PostWithTags>
	singlePostTimestamps: Map<string, number>

	lastFetched: {
		posts: number
		tags: number
		singleContent: number
	}

	// 预加载状态
	preloading: {
		post: string | null
	}
}

export interface CacheActions {
	setPosts: (posts: PostWithTags[]) => void
	setTags: (tags: Tag[]) => void
	setSinglePost: (slug: string, post: PostWithTags) => void

	getSinglePost: (slug: string) => PostWithTags | undefined
	getPost: (slug: string) => PostWithTags | undefined

	fetchPosts: (type?: PostType) => Promise<void>
	fetchTags: () => Promise<void>
	fetchPost: (slug: string) => Promise<void>

	setPreloadingBlog: (slug: string | null) => void

	clearCache: () => void
	isCacheValid: (
		key: keyof CacheState['lastFetched'],
		maxAge?: number,
	) => boolean
	isSingleContentCached: (
		type: 'blog',
		slug: string,
		maxAge?: number,
	) => boolean
}

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

export type AppState = NavigationState &
	NavigationActions &
	CacheState &
	CacheActions &
	UIState &
	UIActions &
	AuthState &
	AuthActions
