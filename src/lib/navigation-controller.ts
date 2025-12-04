import { useAppStore } from './store'
import type {
	BlogPostViewModel,
	ProjectViewModel,
	TagViewModel,
} from './content-providers'
import {
	fetchBlogPostBySlug,
	fetchBlogPosts,
	fetchProjects,
} from './content-providers'

// 导航控制器 - 使用Zustand store的工具函数
export class NavigationController {
	private store = useAppStore

	// 智能数据获取 - 检查缓存后才请求
	async smartFetch(
		fetchFn: () => Promise<unknown>,
		cacheKey: keyof ReturnType<typeof useAppStore.getState>['lastFetched'],
	): Promise<unknown> {
		const { isCacheValid, setLoading, setError } = this.store.getState()

		if (isCacheValid(cacheKey)) {
			return this.getCachedData(cacheKey)
		}

		setLoading(this.mapCacheKeyToLoadingKey(cacheKey), true)
		try {
			const data = await fetchFn()
			this.updateStoreWithData(cacheKey, data)
			return data
		} catch (error) {
			setError(
				this.mapCacheKeyToErrorKey(cacheKey),
				`Failed to fetch ${cacheKey}`,
			)
			throw error
		} finally {
			setLoading(this.mapCacheKeyToLoadingKey(cacheKey), false)
		}
	}

	private getCachedData(
		cacheKey: keyof ReturnType<typeof useAppStore.getState>['lastFetched'],
	) {
		const state = this.store.getState()
		switch (cacheKey) {
			case 'blogPosts':
				return Array.from(state.blogPosts.values())
			case 'projects':
				return Array.from(state.projects.values())
			case 'tags':
				return state.tags
			default:
				return null
		}
	}

	private mapCacheKeyToLoadingKey(
		cacheKey: keyof ReturnType<typeof useAppStore.getState>['lastFetched'],
	) {
		const mapping = {
			blogPosts: 'blogPosts' as const,
			projects: 'projects' as const,
			tags: 'tags' as const,
			singleBlogPost: 'pageTransition' as const,
			singleProject: 'pageTransition' as const,
		}
		return mapping[cacheKey] as keyof ReturnType<
			typeof useAppStore.getState
		>['loadingStates']
	}

	private mapCacheKeyToErrorKey(
		cacheKey: keyof ReturnType<typeof useAppStore.getState>['lastFetched'],
	) {
		const mapping = {
			blogPosts: 'blogPosts' as const,
			projects: 'projects' as const,
			tags: 'tags' as const,
			singleBlogPost: 'blogPosts' as const,
			singleProject: 'projects' as const,
		}
		return mapping[cacheKey] as keyof ReturnType<
			typeof useAppStore.getState
		>['errorStates']
	}

	private updateStoreWithData(
		cacheKey: keyof ReturnType<typeof useAppStore.getState>['lastFetched'],
		data: unknown,
	) {
		const state = this.store.getState()

		switch (cacheKey) {
			case 'blogPosts':
				state.setBlogPosts(data as BlogPostViewModel[])
				break
			case 'projects':
				state.setProjects(data as ProjectViewModel[])
				break
			case 'tags':
				state.setTags(data as TagViewModel[])
				break
		}
	}

	// 预加载数据
	async prefetchDataForPath(path: string) {
		const { isCacheValid, setLoading, setError } = this.store.getState()

		if (path === '/blog') {
			if (!isCacheValid('blogPosts')) {
				setLoading('blogPosts', true)
				try {
					const posts = await fetchBlogPosts()
					this.store.getState().setBlogPosts(posts)
				} catch {
					setError('blogPosts', 'Failed to load blog posts')
				} finally {
					setLoading('blogPosts', false)
				}
			}
		}

		if (path === '/projects') {
			if (!isCacheValid('projects')) {
				setLoading('projects', true)
				try {
					const projects = await fetchProjects()
					this.store.getState().setProjects(projects)
				} catch {
					setError('projects', 'Failed to load projects')
				} finally {
					setLoading('projects', false)
				}
			}
		}

		// 处理动态路由
		const blogMatch = path.match(/^\/blog\/(.+)$/)
		if (blogMatch) {
			const slug = blogMatch[1]
			const cachedPost = this.store.getState().getBlogPost(slug)

			if (!cachedPost) {
				try {
					const post = await fetchBlogPostBySlug(slug)
					if (post) {
						// 更新缓存
						const currentPosts = Array.from(
							this.store.getState().blogPosts.values(),
						)
						currentPosts.push(post as BlogPostViewModel)
						this.store.getState().setBlogPosts(currentPosts)
					}
				} catch (error) {
					console.error('Failed to prefetch blog post:', error)
				}
			}
		}
	}

	// 清理缓存
	clearCache() {
		this.store.getState().clearCache()
	}

	// 获取导航历史
	getNavigationHistory() {
		return this.store.getState().navigationHistory
	}
}

// 创建单例实例
export const navigationController = new NavigationController()

// React hook for using navigation controller
export function useNavigationController() {
	return navigationController
}
