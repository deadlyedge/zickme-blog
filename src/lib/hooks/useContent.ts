import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PostType } from '@/generated/prisma/client'
import { postsOptions, tagsOptions, homeContentOptions } from '../content-queries'
import { fetchPostBySlugAction } from '../actions/content'

// Query Keys
export const contentKeys = {
	all: ['content'] as const,
	posts: (type?: PostType) => ['content', 'posts', type] as const,
	tags: () => ['content', 'tags'] as const,
	post: (slug: string) => ['content', 'post', slug] as const,
}

// Hooks for data fetching
export function usePosts(type: PostType = 'BLOG') {
	return useQuery(postsOptions(type))
}

export function useTags() {
	return useQuery(tagsOptions())
}

export function useHomeContent() {
	return useQuery(homeContentOptions())
}

export function usePost(slug: string) {
	return useQuery({
		queryKey: contentKeys.post(slug),
		queryFn: () => fetchPostBySlugAction(slug),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!slug,
	})
}

// Mutations for data modification (if needed in the future)
export function useContentMutations() {
	const queryClient = useQueryClient()

	const invalidatePosts = (type?: PostType) => {
		queryClient.invalidateQueries({ queryKey: contentKeys.posts(type) })
	}

	const invalidateTags = () => {
		queryClient.invalidateQueries({ queryKey: contentKeys.tags() })
	}

	const invalidatePost = (slug: string) => {
		queryClient.invalidateQueries({ queryKey: contentKeys.post(slug) })
	}

	const invalidateAllContent = () => {
		queryClient.invalidateQueries({ queryKey: contentKeys.all })
	}

	return {
		invalidatePosts,
		invalidateTags,
		invalidatePost,
		invalidateAllContent,
	}
}
