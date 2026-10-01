import { unwrapActionResult } from '@/lib/actions/action-result'
import { getComments } from '@/lib/actions/comments'
import {
	fetchHomePageData,
	fetchPostBySlugAction,
	fetchPostsAction,
	fetchPostsForSearchAction,
	fetchTagsAction,
} from '@/lib/actions/posts'

// Shared cache keys for the client's content queries.
export const contentQueryKeys = {
	all: ['content'] as const,
	posts: () => ['content', 'posts'] as const,
	tags: () => ['content', 'tags'] as const,
	post: (slug: string) => ['content', 'post', slug] as const,
	home: () => ['content', 'home'] as const,
	comments: (docId: string) => ['comments', docId] as const,
	search: () => ['search', 'posts'] as const,
}

export function postsOptions() {
	return {
		queryKey: contentQueryKeys.posts(),
		queryFn: async () => unwrapActionResult(await fetchPostsAction()),
		staleTime: 5 * 60 * 1000,
	}
}

export function tagsOptions() {
	return {
		queryKey: contentQueryKeys.tags(),
		queryFn: async () => unwrapActionResult(await fetchTagsAction()),
		staleTime: 10 * 60 * 1000,
	}
}

export function homePageOptions() {
	return {
		queryKey: contentQueryKeys.home(),
		queryFn: async () => unwrapActionResult(await fetchHomePageData()),
		staleTime: 30 * 60 * 1000,
	}
}

export function postOptions(slug: string) {
	return {
		queryKey: contentQueryKeys.post(slug),
		queryFn: async () => unwrapActionResult(await fetchPostBySlugAction(slug)),
		staleTime: 5 * 60 * 1000,
		enabled: !!slug,
	}
}

export function commentsOptions(docId: string) {
	return {
		queryKey: contentQueryKeys.comments(docId),
		queryFn: async () => unwrapActionResult(await getComments(docId)),
		staleTime: 2 * 60 * 1000,
		enabled: !!docId,
	}
}

export function searchPostsOptions() {
	return {
		queryKey: contentQueryKeys.search(),
		queryFn: async () => unwrapActionResult(await fetchPostsForSearchAction()),
		staleTime: 5 * 60 * 1000,
	}
}
