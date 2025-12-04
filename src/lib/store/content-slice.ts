import { StateCreator } from 'zustand'
import { AppState, CacheActions, CacheState } from './types'
import {
	BlogPostViewModel,
	ProjectViewModel,
	// TagViewModel,
	// BlogPostDetailViewModel,
} from '../content-providers'
import {
	fetchBlogPostsAction,
	fetchProjectsAction,
	fetchTagsAction,
	fetchBlogPostBySlugAction,
	fetchProjectBySlugAction,
} from '../actions/content'

const BLOG_CACHE_DURATION = 10 * 60 * 1000
const PROJECT_CACHE_DURATION = 60 * 60 * 1000
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000

export const createContentSlice: StateCreator<
	AppState,
	[],
	[],
	CacheState & CacheActions
> = (set, get) => ({
	blogPosts: new Map(),
	projects: new Map(),
	tags: [],
	singleBlogPosts: new Map(),
	singleProjects: new Map(),
	singleBlogPostTimestamps: new Map(),
	singleProjectTimestamps: new Map(),
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

	setBlogPosts: (posts) =>
		set((state) => {
			const map = new Map<string, BlogPostViewModel>()
			posts.forEach((post) => map.set(post.slug, post))
			return {
				blogPosts: map,
				lastFetched: { ...state.lastFetched, blogPosts: Date.now() },
			}
		}),
	setProjects: (projects) =>
		set((state) => {
			const map = new Map<string, ProjectViewModel>()
			projects.forEach((project) => map.set(project.slug, project))
			return {
				projects: map,
				lastFetched: { ...state.lastFetched, projects: Date.now() },
			}
		}),
	setTags: (tags) =>
		set((state) => ({
			tags,
			lastFetched: { ...state.lastFetched, tags: Date.now() },
		})),
	setSingleBlogPost: (slug, post) =>
		set((state) => {
			const blogPosts = new Map(state.singleBlogPosts)
			blogPosts.set(slug, post)
			const timestamps = new Map(state.singleBlogPostTimestamps)
			timestamps.set(slug, Date.now())
			return {
				singleBlogPosts: blogPosts,
				singleBlogPostTimestamps: timestamps,
				lastFetched: { ...state.lastFetched, singleContent: Date.now() },
			}
		}),
	setSingleProject: (slug, project) =>
		set((state) => {
			const projects = new Map(state.singleProjects)
			projects.set(slug, project)
			const timestamps = new Map(state.singleProjectTimestamps)
			timestamps.set(slug, Date.now())
			return {
				singleProjects: projects,
				singleProjectTimestamps: timestamps,
				lastFetched: { ...state.lastFetched, singleContent: Date.now() },
			}
		}),

	// Getters
	getSingleBlogPost: (slug) => get().singleBlogPosts.get(slug),
	getSingleProject: (slug) => get().singleProjects.get(slug),
	getBlogPost: (slug) => get().blogPosts.get(slug),
	getProject: (slug) => get().projects.get(slug),

	// Async Thunks
	fetchBlogPosts: async () => {
		if (get().isCacheValid('blogPosts', BLOG_CACHE_DURATION)) return

		set((state) => ({
			loadingStates: { ...state.loadingStates, blogPosts: true },
			errorStates: { ...state.errorStates, blogPosts: null },
		}))

		try {
			const posts = await fetchBlogPostsAction()
			get().setBlogPosts(posts)
		} catch (err) {
			set((state) => ({
				errorStates: {
					...state.errorStates,
					blogPosts: (err as Error).message,
				},
			}))
		} finally {
			set((state) => ({
				loadingStates: { ...state.loadingStates, blogPosts: false },
			}))
		}
	},

	fetchProjects: async () => {
		if (get().isCacheValid('projects', PROJECT_CACHE_DURATION)) return

		set((state) => ({
			loadingStates: { ...state.loadingStates, projects: true },
			errorStates: { ...state.errorStates, projects: null },
		}))

		try {
			const projects = await fetchProjectsAction()
			get().setProjects(projects)
		} catch (err) {
			set((state) => ({
				errorStates: { ...state.errorStates, projects: (err as Error).message },
			}))
		} finally {
			set((state) => ({
				loadingStates: { ...state.loadingStates, projects: false },
			}))
		}
	},

	fetchTags: async () => {
		// Tags change less frequently, maybe match BLOG_CACHE_DURATION or use DEFAULT
		if (get().isCacheValid('tags', BLOG_CACHE_DURATION)) return

		set((state) => ({
			loadingStates: { ...state.loadingStates, tags: true },
			errorStates: { ...state.errorStates, tags: null },
		}))

		try {
			const tags = await fetchTagsAction()
			get().setTags(tags)
		} catch (err) {
			set((state) => ({
				errorStates: { ...state.errorStates, tags: (err as Error).message },
			}))
		} finally {
			set((state) => ({
				loadingStates: { ...state.loadingStates, tags: false },
			}))
		}
	},

	fetchBlogPost: async (slug: string) => {
		if (get().isSingleContentCached('blog', slug, BLOG_CACHE_DURATION)) return

		get().setPreloadingBlog(slug)

		try {
			const post = await fetchBlogPostBySlugAction(slug)
			if (post) {
				get().setSingleBlogPost(slug, post)
			} else {
				// 可以选择设置一个 404 错误，或者什么都不做
				throw new Error('Not found')
			}
		} catch (err) {
			// 这里我们一般只在控制台打印，因为详情页通常会有自己的 loading/error UI 处理
			console.error(err)
		} finally {
			get().setPreloadingBlog(null)
		}
	},

	fetchProject: async (slug: string) => {
		if (get().isSingleContentCached('project', slug, PROJECT_CACHE_DURATION))
			return

		get().setPreloadingProject(slug)

		try {
			const project = await fetchProjectBySlugAction(slug)
			if (project) {
				get().setSingleProject(slug, project)
			} else {
				throw new Error('Not found')
			}
		} catch (err) {
			console.error(err)
		} finally {
			get().setPreloadingProject(null)
		}
	},

	setPreloadingBlog: (slug) =>
		set((state) => ({
			preloading: { ...state.preloading, blogPost: slug },
		})),
	setPreloadingProject: (slug) =>
		set((state) => ({
			preloading: { ...state.preloading, project: slug },
		})),

	clearCache: () =>
		set({
			blogPosts: new Map(),
			projects: new Map(),
			tags: [],
			singleBlogPosts: new Map(),
			singleProjects: new Map(),
			singleBlogPostTimestamps: new Map(),
			singleProjectTimestamps: new Map(),
			lastFetched: {
				blogPosts: 0,
				projects: 0,
				tags: 0,
				singleContent: 0,
			},
		}),
	isCacheValid: (key, maxAge = DEFAULT_CACHE_DURATION) => {
		const lastFetched = get().lastFetched[key]
		return Date.now() - lastFetched < maxAge
	},
	isSingleContentCached: (type, slug, maxAge = DEFAULT_CACHE_DURATION) => {
		const timestamps =
			type === 'blog'
				? get().singleBlogPostTimestamps
				: get().singleProjectTimestamps
		const lastFetched = timestamps.get(slug)
		return Boolean(lastFetched && Date.now() - lastFetched < maxAge)
	},
})
