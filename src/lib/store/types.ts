import type { Post, Tag } from '@/generated/prisma/client'

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
	blogPosts: Map<string, Post>
	tags: Tag[]

	// 单篇内容数据 - 按 slug 缓存
	singleBlogPosts: Map<string, Post>
	singleBlogPostTimestamps: Map<string, number>

	lastFetched: {
		blogPosts: number
		tags: number
		singleContent: number
	}

	// 预加载状态
	preloading: {
		blogPost: string | null
	}
}

export interface CacheActions {
	setBlogPosts: (posts: Post[]) => void
	setTags: (tags: Tag[]) => void
	setSingleBlogPost: (slug: string, post: Post) => void

	getSingleBlogPost: (slug: string) => Post | undefined
	getBlogPost: (slug: string) => Post | undefined

	fetchBlogPosts: () => Promise<void>
	fetchTags: () => Promise<void>
	fetchBlogPost: (slug: string) => Promise<void>

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
		blogPosts: boolean
		tags: boolean
		pageTransition: boolean
	}
	errorStates: {
		blogPosts: string | null
		tags: string | null
	}
}

export interface UIActions {
	setLoading: (key: keyof UIState['loadingStates'], loading: boolean) => void
	setError: (key: keyof UIState['errorStates'], error: string | null) => void
}

export interface User {
	id: string
	name?: string
	email: string
	emailVerified?: boolean
	image?: string | null
	createdAt?: Date
	updatedAt?: Date
	[key: string]: unknown
}

export interface AuthState {
	user: User | null
	isAuthModalOpen: boolean
	authModalView: 'login' | 'register' | 'profile'
	loading: {
		login: boolean
		register: boolean
		logout: boolean
		updateProfile: boolean
	}
	error: string | null
}

export interface AuthActions {
	// 用户操作
	login: (email: string, password: string) => Promise<void>
	register: (
		username: string,
		email: string,
		password: string,
		confirmPassword: string,
	) => Promise<void>
	logout: () => Promise<void>
	updateProfile: (
		username: string,
		currentPassword: string,
		newPassword?: string,
	) => Promise<void>
	checkAuth: () => Promise<User | null>

	// Modal 控制
	openAuthModal: (view: 'login' | 'register' | 'profile') => void
	closeAuthModal: () => void

	// 状态管理
	setError: (error: string | null) => void
	setLoading: (action: keyof AuthState['loading'], loading: boolean) => void
}

export type AppState = NavigationState &
	NavigationActions &
	CacheState &
	CacheActions &
	UIState &
	UIActions &
	AuthState &
	AuthActions
