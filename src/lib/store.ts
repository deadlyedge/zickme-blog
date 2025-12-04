import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BlogPostViewModel, ProjectViewModel, TagViewModel, BlogPostDetailViewModel } from './content-providers'

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

	// 单篇内容数据
	singleBlogPost: BlogPostDetailViewModel | null
	singleProject: ProjectViewModel | null

	lastFetched: {
		blogPosts: number
		projects: number
		tags: number
		singleBlogPost: number
		singleProject: number
	}

	// 预加载状态
	preloading: {
		blogPost: string | null  // 正在预加载的blog slug
		project: string | null   // 正在预加载的project slug
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
	setSingleBlogPost: (post: BlogPostDetailViewModel | null) => void
	setSingleProject: (project: ProjectViewModel | null) => void
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
	isCacheValid: (key: keyof CacheState['lastFetched'], maxAge?: number) => boolean
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
			singleBlogPost: null,
			singleProject: null,
			lastFetched: {
				blogPosts: 0,
				projects: 0,
				tags: 0,
				singleBlogPost: 0,
				singleProject: 0,
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
			setCurrentPath: (path) => set((state) => ({
				currentPath: path,
				navigationHistory: [...state.navigationHistory.slice(-9), path] // Keep last 10
			})),
			addToHistory: (path) => set((state) => ({
				navigationHistory: [...state.navigationHistory.slice(-9), path]
			})),

			// Cache actions
			setBlogPosts: (posts) => set((state) => {
				const postMap = new Map()
				posts.forEach(post => postMap.set(post.slug, post))
				return {
					blogPosts: postMap,
					lastFetched: { ...state.lastFetched, blogPosts: Date.now() }
				}
			}),
			setProjects: (projects) => set((state) => {
				const projectMap = new Map()
				projects.forEach(project => projectMap.set(project.slug, project))
				return {
					projects: projectMap,
					lastFetched: { ...state.lastFetched, projects: Date.now() }
				}
			}),
			setTags: (tags) => set((state) => ({
				tags,
				lastFetched: { ...state.lastFetched, tags: Date.now() }
			})),
			setSingleBlogPost: (post) => set((state) => ({
				singleBlogPost: post,
				lastFetched: { ...state.lastFetched, singleBlogPost: Date.now() }
			})),
			setSingleProject: (project) => set((state) => ({
				singleProject: project,
				lastFetched: { ...state.lastFetched, singleProject: Date.now() }
			})),
			getBlogPost: (slug) => get().blogPosts.get(slug),
			getProject: (slug) => get().projects.get(slug),

			// Preloading actions
			setPreloadingBlog: (slug) => set((state) => ({
				preloading: { ...state.preloading, blogPost: slug }
			})),
			setPreloadingProject: (slug) => set((state) => ({
				preloading: { ...state.preloading, project: slug }
			})),

			// Loading actions
			setLoading: (key, loading) => set((state) => ({
				loadingStates: { ...state.loadingStates, [key]: loading }
			})),
			setError: (key, error) => set((state) => ({
				errorStates: { ...state.errorStates, [key]: error }
			})),

			// Utility actions
			clearCache: () => set({
				blogPosts: new Map(),
				projects: new Map(),
				tags: [],
				singleBlogPost: null,
				singleProject: null,
				lastFetched: {
					blogPosts: 0,
					projects: 0,
					tags: 0,
					singleBlogPost: 0,
					singleProject: 0
				}
			}),
			isCacheValid: (key, maxAge = CACHE_DURATION) => {
				const lastFetched = get().lastFetched[key]
				return Date.now() - lastFetched < maxAge
			},
		}),
		{ name: 'app-store' }
	)
)
