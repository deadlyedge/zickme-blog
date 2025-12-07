import { StateCreator } from 'zustand'
import type { AppState, CacheActions, CacheState } from './types'
import {
	fetchBlogPostsAction,
	fetchTagsAction,
	fetchBlogPostBySlugAction,
} from '../actions/content'
import type { Post } from '@/generated/prisma/client'

const BLOG_CACHE_DURATION = 1 * 60 * 1000
const DEFAULT_CACHE_DURATION = 1 * 60 * 1000

export const createContentSlice: StateCreator<
	AppState,
	[],
	[],
	CacheState & CacheActions
> = (set, get) => ({
	blogPosts: new Map(),
	tags: [],
	singleBlogPosts: new Map(),
	singleBlogPostTimestamps: new Map(),
	lastFetched: {
		blogPosts: 0,
		tags: 0,
		singleContent: 0,
	},
	preloading: {
		blogPost: null,
	},

	setBlogPosts: (posts) =>
		set((state) => {
			const map = new Map<string, Post>()
			posts.forEach((post) => map.set(post.slug, post))
			return {
				blogPosts: map,
				lastFetched: { ...state.lastFetched, blogPosts: Date.now() },
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

	// Getters
	getSingleBlogPost: (slug) => get().singleBlogPosts.get(slug),
	getBlogPost: (slug) => get().blogPosts.get(slug),

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

	setPreloadingBlog: (slug) =>
		set((state) => ({
			preloading: { ...state.preloading, blogPost: slug },
		})),

	clearCache: () =>
		set({
			blogPosts: new Map(),
			tags: [],
			singleBlogPosts: new Map(),
			singleBlogPostTimestamps: new Map(),
			lastFetched: {
				blogPosts: 0,
				tags: 0,
				singleContent: 0,
			},
		}),
	isCacheValid: (key, maxAge = DEFAULT_CACHE_DURATION) => {
		const lastFetched = get().lastFetched[key]
		return Date.now() - lastFetched < maxAge
	},
	isSingleContentCached: (type, slug, maxAge = DEFAULT_CACHE_DURATION) => {
		const timestamps = get().singleBlogPostTimestamps
		const lastFetched = timestamps.get(slug)
		return Boolean(lastFetched && Date.now() - lastFetched < maxAge)
	},
})
