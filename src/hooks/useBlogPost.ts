import { useQuery } from '@tanstack/react-query'
import type { BlogPostDetailViewModel } from '@/lib/content-providers'

const fetchBlogPostBySlug = async (slug: string): Promise<BlogPostDetailViewModel | null> => {
	const response = await fetch(`/api/blog-posts/${slug}`)
	if (!response.ok) {
		if (response.status === 404) {
			return null
		}
		throw new Error('Failed to fetch blog post')
	}
	return response.json()
}

export const useBlogPost = (slug: string) => {
	return useQuery({
		queryKey: ['blog-post', slug],
		queryFn: () => fetchBlogPostBySlug(slug),
		staleTime: 10 * 60 * 1000, // 10 minutes
		enabled: !!slug,
	})
}
