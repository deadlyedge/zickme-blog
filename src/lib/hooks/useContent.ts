'use client'

import {
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { type CreateCommentData, createComment } from '@/lib/actions/comments'
import {
	commentsOptions,
	contentQueryKeys,
	homePageOptions,
	postOptions,
	postsOptions,
	searchPostsOptions,
	tagsOptions,
} from '@/lib/content-queries'
import type { PostWithTags } from '@/types/content/post'

// Hook to fetch all posts
export function usePosts() {
	return useQuery(postsOptions())
}

// Hook to fetch a single post by slug
export function usePost(
	slug: string,
	options?: Partial<UseQueryOptions<PostWithTags | null>>,
) {
	return useQuery({
		...postOptions(slug),
		...options,
	})
}

// Hook to fetch all tags
export function useTags() {
	return useQuery(tagsOptions())
}

// Hook to fetch home page content
export function useHomeContent() {
	return useQuery(homePageOptions())
}

// Hook for search functionality
export function useSearchContent() {
	return useQuery(searchPostsOptions())
}

// Hook for post invalidation utilities
export function useInvalidateContent() {
	const queryClient = useQueryClient()

	const invalidatePosts = () => {
		return queryClient.invalidateQueries({
			queryKey: contentQueryKeys.posts(),
		})
	}

	const invalidatePost = (slug: string) => {
		return queryClient.invalidateQueries({
			queryKey: contentQueryKeys.post(slug),
		})
	}

	const invalidateAll = () => {
		return queryClient.invalidateQueries({
			queryKey: contentQueryKeys.all,
		})
	}

	return {
		invalidatePosts,
		invalidatePost,
		invalidateAll,
	}
}

// Hook to fetch comments for a post
export function useComments(docId: string) {
	return useQuery(commentsOptions(docId))
}

// Hook to create a new comment
export function useCreateComment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreateCommentData) => createComment(data),
		onSuccess: (_, variables) => {
			// Invalidate comments query for this specific post
			void queryClient.invalidateQueries({
				queryKey: contentQueryKeys.comments(variables.docId),
			})
		},
	})
}
