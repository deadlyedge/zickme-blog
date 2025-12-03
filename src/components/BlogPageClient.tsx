'use client'

import { useBlogPosts, useTags } from '@/hooks/useBlogData'
import BlogGridClient from '@/components/BlogGridClient'

export function BlogPageClient() {
	const { data: posts, isLoading: postsLoading, error: postsError } = useBlogPosts()
	const { data: tags, isLoading: tagsLoading, error: tagsError } = useTags()

	if (postsLoading || tagsLoading) {
		return (
			<div className="pt-16 overflow-y-auto h-svh flex items-center justify-center">
				<div>Loading...</div>
			</div>
		)
	}

	if (postsError || tagsError) {
		return (
			<div className="pt-16 overflow-y-auto h-svh flex items-center justify-center">
				<div>Error loading blog data</div>
			</div>
		)
	}

	if (!posts || !tags) {
		return (
			<div className="pt-16 overflow-y-auto h-svh flex items-center justify-center">
				<div>No data available</div>
			</div>
		)
	}

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			<div className="mx-auto max-w-7xl p-6">
				<h1 className="text-4xl font-bold mb-8">博客文章</h1>

				<BlogGridClient posts={posts} tags={tags} />
			</div>
		</div>
	)
}
