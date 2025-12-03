import { notFound } from 'next/navigation'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { BlogPostPageClient } from '@/components/BlogPostPageClient'
import { fetchBlogPostBySlug } from '@/lib/content-providers'
import { getComments } from '@/lib/actions/comments'

interface PageProps {
	params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: PageProps) {
	const { slug } = await params
	const queryClient = getQueryClient()

	// Check if post exists
	const post = await fetchBlogPostBySlug(slug)
	if (!post) {
		notFound()
	}

	// Prefetch blog post data
	await queryClient.prefetchQuery({
		queryKey: ['blog-post', slug],
		queryFn: () => fetchBlogPostBySlug(slug),
		staleTime: 10 * 60 * 1000,
	})

	// Prefetch comments data
	await queryClient.prefetchQuery({
		queryKey: ['comments', 'posts', post.id],
		queryFn: () => getComments(post.id, 'posts'),
		staleTime: 2 * 60 * 1000,
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<BlogPostPageClient slug={slug} />
		</HydrationBoundary>
	)
}
