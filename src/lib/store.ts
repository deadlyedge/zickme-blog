import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BlogPostViewModel, ProjectViewModel, TagViewModel } from './content-providers'

interface NavigationState {
	isNavigating: boolean
	currentPath: string
	navigationHistory: string[]
}

interface CacheState {
	blogPosts: Map<string, BlogPostViewModel>
	projects: Map<string, ProjectViewModel>
	tags: TagViewModel[]
	lastFetched: {
		blogPosts: number
		projects: number
		tags: number
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
	getBlogPost: (slug: string) => BlogPostViewModel | undefined
	getProject: (slug: string) => ProjectViewModel | undefined

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
			lastFetched: {
				blogPosts: 0,
				projects: 0,
				tags: 0,
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
			getBlogPost: (slug) => get().blogPosts.get(slug),
			getProject: (slug) => get().projects.get(slug),

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
				lastFetched: { blogPosts: 0, projects: 0, tags: 0 }
			}),
			isCacheValid: (key, maxAge = CACHE_DURATION) => {
				const lastFetched = get().lastFetched[key]
				return Date.now() - lastFetched < maxAge
			},
		}),
		{ name: 'app-store' }
	)
)
