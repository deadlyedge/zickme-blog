import { StateCreator } from 'zustand'
import type { AppState, CacheActions, CacheState } from './types'
import {
	fetchPostsAction,
	fetchTagsAction,
	fetchPostBySlugAction,
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
	posts: new Map(),
	tags: [],
	singlePosts: new Map(),
	singlePostTimestamps: new Map(),
	lastFetched: {
		posts: 0,
		tags: 0,
		singleContent: 0,
	},
	preloading: {
		post: null,
	},

	setPosts: (posts) =>
		set((state) => {
			const map = new Map<string, Post>()
			posts.forEach((post) => map.set(post.slug, post))
			return {
				posts: map,
				lastFetched: { ...state.lastFetched, posts: Date.now() },
			}
		}),
	setTags: (tags) =>
		set((state) => ({
			tags,
			lastFetched: { ...state.lastFetched, tags: Date.now() },
		})),
	setSinglePost: (slug, post) =>
		set((state) => {
			const posts = new Map(state.singlePosts)
			posts.set(slug, post)
			const timestamps = new Map(state.singlePostTimestamps)
			timestamps.set(slug, Date.now())
			return {
				singlePosts: posts,
				singlePostTimestamps: timestamps,
				lastFetched: { ...state.lastFetched, singleContent: Date.now() },
			}
		}),

	// Getters
	getSinglePost: (slug) => get().singlePosts.get(slug),
	getPost: (slug) => get().posts.get(slug),

	// Async Thunks
	fetchPosts: async () => {
		if (get().isCacheValid('posts', BLOG_CACHE_DURATION)) return

		set((state) => ({
			loadingStates: { ...state.loadingStates, posts: true },
			errorStates: { ...state.errorStates, posts: null },
		}))

		try {
			const posts = await fetchPostsAction()
			get().setPosts(posts)
		} catch (err) {
			set((state) => ({
				errorStates: {
					...state.errorStates,
					posts: (err as Error).message,
				},
			}))
		} finally {
			set((state) => ({
				loadingStates: { ...state.loadingStates, posts: false },
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

	fetchPost: async (slug: string) => {
		if (get().isSingleContentCached('blog', slug, BLOG_CACHE_DURATION)) return

		get().setPreloadingBlog(slug)

		try {
			const post = await fetchPostBySlugAction(slug)
			if (post) {
				get().setSinglePost(slug, post)
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
			preloading: { ...state.preloading, post: slug },
		})),

	clearCache: () =>
		set({
			posts: new Map(),
			tags: [],
			singlePosts: new Map(),
			singlePostTimestamps: new Map(),
			lastFetched: {
				posts: 0,
				tags: 0,
				singleContent: 0,
			},
		}),
	isCacheValid: (key, maxAge = DEFAULT_CACHE_DURATION) => {
		const lastFetched = get().lastFetched[key]
		return Date.now() - lastFetched < maxAge
	},
	isSingleContentCached: (type, slug, maxAge = DEFAULT_CACHE_DURATION) => {
		const timestamps = get().singlePostTimestamps
		const lastFetched = timestamps.get(slug)
		return Boolean(lastFetched && Date.now() - lastFetched < maxAge)
	},
})
