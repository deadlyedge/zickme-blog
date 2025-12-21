import type { PostType } from '@/generated/prisma/client'
import { getComments } from './actions/comments'
import {
	fetchAllContentForSearchAction,
	fetchHomeContent,
	fetchPostBySlugAction,
	fetchPostsAction,
	fetchTagsAction,
} from './actions/content'

// Query Keys - 统一管理所有查询的key定义
export const contentKeys = {
	all: ['content'] as const,
	posts: (type?: PostType) => ['content', 'posts', type] as const,
	tags: () => ['content', 'tags'] as const,
	post: (slug: string) => ['content', 'post', slug] as const,
	home: () => ['content', 'home'] as const,
	comments: (docId: string) => ['comments', docId] as const,
	search: () => ['search', 'all-content'] as const,
}

// Query options for content
export function postsOptions(type: PostType = 'BLOG') {
	return {
		queryKey: contentKeys.posts(type),
		queryFn: () => fetchPostsAction(type),
		staleTime: 5 * 60 * 1000, // 5 minutes
	}
}

export function tagsOptions() {
	return {
		queryKey: contentKeys.tags(),
		queryFn: () => fetchTagsAction(),
		staleTime: 10 * 60 * 1000, // 10 minutes
	}
}

export function homeContentOptions() {
	return {
		queryKey: contentKeys.home(),
		queryFn: () => fetchHomeContent(),
		staleTime: 30 * 60 * 1000, // 30 minutes (首页内容变化较慢)
	}
}

export function postOptions(slug: string) {
	return {
		queryKey: contentKeys.post(slug),
		queryFn: () => fetchPostBySlugAction(slug),
		staleTime: 5 * 60 * 1000, // 5 minutes
		enabled: !!slug,
	}
}

export function commentsOptions(docId: string) {
	return {
		queryKey: contentKeys.comments(docId),
		queryFn: () => getComments(docId),
		staleTime: 2 * 60 * 1000, // 2 minutes for comments
		enabled: !!docId,
	}
}

export function searchContentOptions() {
	return {
		queryKey: contentKeys.search(),
		queryFn: () => fetchAllContentForSearchAction(),
		staleTime: 5 * 60 * 1000, // 5 minutes
	}
}
