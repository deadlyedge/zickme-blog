import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
	BlogPostViewModel,
	ProjectViewModel,
	TagViewModel,
	BlogPostDetailViewModel,
} from './content-providers'

interface NavigationState {
	isNavigating: boolean
	currentPath: string
	navigationHistory: string[]
}

interface CacheState {
	// 列表数据
	blogPosts: Map<string, BlogPostViewModel>
	projects: Map<string, ProjectViewModel>
	tags: TagViewModel[]

	// 单篇内容数据 - 按slug缓存
	singleBlogPosts: Map<string, BlogPostDetailViewModel>
	singleProjects: Map<string, ProjectViewModel>

	lastFetched: {
		blogPosts: number
		projects: number
		tags: number
		singleContent: number // 最后一次获取单篇内容的通用时间戳
	}

	// 预加载状态
	preloading: {
		blogPost: string | null // 正在预加载的blog slug
		project: string | null // 正在预加载的project slug
	}
}

interface UIState {
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

interface AppState extends NavigationState, CacheState, UIState {
	// Navigation actions
	setNavigating: (navigating: boolean) => void
	setCurrentPath: (path: string) => void
	addToHistory: (path: string) => void

	// Cache actions
	setBlogPosts: (posts: BlogPostViewModel[]) => void
	setProjects: (projects: ProjectViewModel[]) => void
	setTags: (tags: TagViewModel[]) => void
	setSingleBlogPost: (slug: string, post: BlogPostDetailViewModel) => void
	setSingleProject: (slug: string, project: ProjectViewModel) => void
	getSingleBlogPost: (slug: string) => BlogPostDetailViewModel | undefined
	getSingleProject: (slug: string) => ProjectViewModel | undefined
	getBlogPost: (slug: string) => BlogPostViewModel | undefined
	getProject: (slug: string) => ProjectViewModel | undefined

	// Preloading actions
	setPreloadingBlog: (slug: string | null) => void
	setPreloadingProject: (slug: string | null) => void

	// Loading actions
	setLoading: (key: keyof UIState['loadingStates'], loading: boolean) => void
	setError: (key: keyof UIState['errorStates'], error: string | null) => void

	// Utility actions
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

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useAppStore = create<AppState>()(
	devtools(
		(set, get) => ({
			// Navigation state
			isNavigating: false,
			currentPath: '/',
			navigationHistory: ['/'],

			// Cache state
			blogPosts: new Map(),
			projects: new Map(),
			tags: [],
			singleBlogPosts: new Map(),
			singleProjects: new Map(),
			lastFetched: {
				blogPosts: 0,
				projects: 0,
				tags: 0,
				singleContent: 0,
			},
			preloading: {
				blogPost: null,
				project: null,
			},

			// UI state
			loadingStates: {
				blogPosts: false,
				projects: false,
				tags: false,
				pageTransition: false,
			},
			errorStates: {
				blogPosts: null,
				projects: null,
				tags: null,
			},

			// Navigation actions
			setNavigating: (navigating) => set({ isNavigating: navigating }),
			setCurrentPath: (path) =>
				set((state) => ({
					currentPath: path,
					navigationHistory: [...state.navigationHistory.slice(-9), path], // Keep last 10
				})),
			addToHistory: (path) =>
				set((state) => ({
					navigationHistory: [...state.navigationHistory.slice(-9), path],
				})),

			// Cache actions
			setBlogPosts: (posts) =>
				set((state) => {
					const postMap = new Map()
					posts.forEach((post) => postMap.set(post.slug, post))
					return {
						blogPosts: postMap,
						lastFetched: { ...state.lastFetched, blogPosts: Date.now() },
					}
				}),
			setProjects: (projects) =>
				set((state) => {
					const projectMap = new Map()
					projects.forEach((project) => projectMap.set(project.slug, project))
					return {
						projects: projectMap,
						lastFetched: { ...state.lastFetched, projects: Date.now() },
					}
				}),
			setTags: (tags) =>
				set((state) => ({
					tags,
					lastFetched: { ...state.lastFetched, tags: Date.now() },
				})),
			setSingleBlogPost: (slug, post) =>
				set((state) => ({
					singleBlogPosts: new Map(state.singleBlogPosts.set(slug, post)),
					lastFetched: { ...state.lastFetched, singleContent: Date.now() },
				})),
			setSingleProject: (slug, project) =>
				set((state) => ({
					singleProjects: new Map(state.singleProjects.set(slug, project)),
					lastFetched: { ...state.lastFetched, singleContent: Date.now() },
				})),
			getSingleBlogPost: (slug) => get().singleBlogPosts.get(slug),
			getSingleProject: (slug) => get().singleProjects.get(slug),
			getBlogPost: (slug) => get().blogPosts.get(slug),
			getProject: (slug) => get().projects.get(slug),

			// Preloading actions
			setPreloadingBlog: (slug) =>
				set((state) => ({
					preloading: { ...state.preloading, blogPost: slug },
				})),
			setPreloadingProject: (slug) =>
				set((state) => ({
					preloading: { ...state.preloading, project: slug },
				})),

			// Loading actions
			setLoading: (key, loading) =>
				set((state) => ({
					loadingStates: { ...state.loadingStates, [key]: loading },
				})),
			setError: (key, error) =>
				set((state) => ({
					errorStates: { ...state.errorStates, [key]: error },
				})),

			// Utility actions
			clearCache: () =>
				set({
					blogPosts: new Map(),
					projects: new Map(),
					tags: [],
					singleBlogPosts: new Map(),
					singleProjects: new Map(),
					lastFetched: {
						blogPosts: 0,
						projects: 0,
						tags: 0,
						singleContent: 0,
					},
				}),
			isCacheValid: (key, maxAge = CACHE_DURATION) => {
				const lastFetched = get().lastFetched[key]
				return Date.now() - lastFetched < maxAge
			},
			isSingleContentCached: (type, slug, maxAge = CACHE_DURATION) => {
				const lastFetched = get().lastFetched.singleContent
				const hasContent =
					type === 'blog'
						? get().singleBlogPosts.has(slug)
						: get().singleProjects.has(slug)
				return hasContent && Date.now() - lastFetched < maxAge
			},
		}),
		{ name: 'app-store' },
	),
)
