import {
	BlogPostViewModel,
	ProjectViewModel,
	TagViewModel,
	BlogPostDetailViewModel,
} from '../content-providers'

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
	blogPosts: Map<string, BlogPostViewModel>
	projects: Map<string, ProjectViewModel>
	tags: TagViewModel[]

	// 单篇内容数据 - 按 slug 缓存
	singleBlogPosts: Map<string, BlogPostDetailViewModel>
	singleProjects: Map<string, ProjectViewModel>
	singleBlogPostTimestamps: Map<string, number>
	singleProjectTimestamps: Map<string, number>

	lastFetched: {
		blogPosts: number
		projects: number
		tags: number
		singleContent: number
	}

	// 预加载状态
	preloading: {
		blogPost: string | null
		project: string | null
	}
}

export interface CacheActions {
	setBlogPosts: (posts: BlogPostViewModel[]) => void
	setProjects: (projects: ProjectViewModel[]) => void
	setTags: (tags: TagViewModel[]) => void
	setSingleBlogPost: (slug: string, post: BlogPostDetailViewModel) => void
	setSingleProject: (slug: string, project: ProjectViewModel) => void

	getSingleBlogPost: (slug: string) => BlogPostDetailViewModel | undefined
	getSingleProject: (slug: string) => ProjectViewModel | undefined
	getBlogPost: (slug: string) => BlogPostViewModel | undefined
	getProject: (slug: string) => ProjectViewModel | undefined

	fetchBlogPosts: () => Promise<void>
	fetchProjects: () => Promise<void>
	fetchTags: () => Promise<void>
	fetchBlogPost: (slug: string) => Promise<void>
	fetchProject: (slug: string) => Promise<void>

	setPreloadingBlog: (slug: string | null) => void
	setPreloadingProject: (slug: string | null) => void

	clearCache: () => void
	isCacheValid: (
		key: keyof CacheState['lastFetched'],
		maxAge?: number,
	) => boolean
	isSingleContentCached: (
		type: 'blog' | 'project',
		slug: string,
		maxAge?: number,
	) => boolean
}

export interface UIState {
	loadingStates: {
		blogPosts: boolean
		projects: boolean
		tags: boolean
		pageTransition: boolean
	}
	errorStates: {
		blogPosts: string | null
		projects: string | null
		tags: string | null
	}
}

export interface UIActions {
	setLoading: (key: keyof UIState['loadingStates'], loading: boolean) => void
	setError: (key: keyof UIState['errorStates'], error: string | null) => void
}

export interface User {
	id: string
	username: string
	email: string
	profile: {
		avatar: { url: string }
		bio: string
	}
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
