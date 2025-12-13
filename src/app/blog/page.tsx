import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { buildMetadata } from '@/lib/seo'
import { Metadata } from 'next'
import { getQueryClient } from '@/lib/query-client'
import { postsOptions, tagsOptions } from '@/lib/content-queries'
import { PostGridClient } from '@/components/PostGridClient'

// 每5分钟重新验证一次
export const revalidate = 300

export const metadata: Metadata = buildMetadata({
	title: '博客文章',
	description: '浏览我的所有博客文章',
})

export default function BlogPage() {
	const queryClient = getQueryClient()

	// 预取数据
	void queryClient.prefetchQuery(postsOptions('BLOG'))
	void queryClient.prefetchQuery(tagsOptions())

	return (
		<main>
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto max-w-7xl p-6">
					<h1 className="text-4xl font-bold mb-8">博客文章</h1>

					<HydrationBoundary state={dehydrate(queryClient)}>
						<PostGridClient type='BLOG' />
					</HydrationBoundary>
				</div>
			</div>
		</main>
	)
}
