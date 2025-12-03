import { useQuery } from '@tanstack/react-query'
import type { BlogPostViewModel, TagViewModel } from '@/lib/content-providers'

const fetchBlogPosts = async (): Promise<BlogPostViewModel[]> => {
	const response = await fetch('/api/blog-posts')
	if (!response.ok) {
		throw new Error('Failed to fetch blog posts')
	}
	return response.json()
}

const fetchTags = async (): Promise<TagViewModel[]> => {
	const response = await fetch('/api/tags')
	if (!response.ok) {
		throw new Error('Failed to fetch tags')
	}
	return response.json()
}

export const useBlogPosts = () => {
	return useQuery({
		queryKey: ['blog-posts'],
		queryFn: fetchBlogPosts,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}

export const useTags = () => {
	return useQuery({
		queryKey: ['tags'],
		queryFn: fetchTags,
		staleTime: 10 * 60 * 1000, // 10 minutes
	})
}
