import {
	useQuery,
	useQueryClient,
	useMutation,
	UseQueryOptions,
} from '@tanstack/react-query'
import type { PostType } from '@/generated/prisma/client'

import { fetchPostBySlugAction } from '@/lib/actions/content'
import {
	getComments,
	createComment,
	type CreateCommentData,
} from '@/lib/actions/comments'
import {
	postsOptions,
	tagsOptions,
	homeContentOptions,
} from '@/lib/content-queries'

import type { PostWithTags } from '@/types'

// Query Keys
export const contentKeys = {
	all: ['content'] as const,
	posts: (type?: PostType) => ['content', 'posts', type] as const,
	tags: () => ['content', 'tags'] as const,
	post: (slug: string) => ['content', 'post', slug] as const,
	comments: (docId: string) => ['comments', docId] as const,
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

export function usePost(
	slug: string,
	options?: Partial<UseQueryOptions<PostWithTags | null>>,
) {
	return useQuery({
		queryKey: contentKeys.post(slug),
		queryFn: () => fetchPostBySlugAction(slug),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!slug,
		...options, // Spread additional options including initialData
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

// Comment hooks
export function useComments(docId: string) {
	return useQuery({
		queryKey: contentKeys.comments(docId),
		queryFn: () => getComments(docId),
		staleTime: 2 * 60 * 1000, // 2 minutes for comments
		enabled: !!docId,
	})
}

export function useCreateComment() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: CreateCommentData) => createComment(data),
		onSuccess: (result, variables) => {
			if (result.success) {
				// Invalidate and refetch comments for this doc
				queryClient.invalidateQueries({
					queryKey: contentKeys.comments(variables.docId),
				})
			}
		},
	})
}
