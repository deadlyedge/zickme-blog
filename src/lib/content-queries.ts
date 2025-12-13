import { PostType } from '@/generated/prisma/client'
import {
	fetchPostsAction,
	fetchTagsAction,
	fetchHomeContent,
} from './actions/content'

// Query options for content
export function postsOptions(type: PostType = 'BLOG') {
	return {
		queryKey: ['content', 'posts', type] as const,
		queryFn: () => fetchPostsAction(type),
		staleTime: 5 * 60 * 1000, // 5 minutes
	}
}

export function tagsOptions() {
	return {
		queryKey: ['content', 'tags'] as const,
		queryFn: () => fetchTagsAction(),
		staleTime: 10 * 60 * 1000, // 10 minutes
	}
}

export function homeContentOptions() {
	return {
		queryKey: ['posts', 'siteProfile'] as const,
		queryFn: () => fetchHomeContent(),
		staleTime: 30 * 60 * 1000, // 30 minutes (首页内容变化较慢)
	}
}
