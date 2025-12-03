import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { BlogPageClient } from '@/components/BlogPageClient'
import { fetchBlogPosts, fetchTags } from '@/lib/content-providers'

export default async function BlogPage() {
	const queryClient = getQueryClient()

	// Prefetch blog data
	await Promise.all([
		queryClient.prefetchQuery({
			queryKey: ['blog-posts'],
			queryFn: fetchBlogPosts,
			staleTime: 5 * 60 * 1000,
		}),
		queryClient.prefetchQuery({
			queryKey: ['tags'],
			queryFn: fetchTags,
			staleTime: 10 * 60 * 1000,
		}),
	])

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<BlogPageClient />
		</HydrationBoundary>
	)
}
