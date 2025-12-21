import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PostGridClient } from '@/components/PostGridClient'
import { postsOptions } from '@/lib/content-queries'
import { getQueryClient } from '@/lib/query-client'
import { buildMetadata } from '@/lib/seo'

// 5分钟重新验证一次，与Query缓存保持一致
export const revalidate = 300

export const metadata: Metadata = buildMetadata({
	title: '博客文章',
	description: '浏览我的所有博客文章',
})

export default function BlogPage() {
	const queryClient = getQueryClient()

	// 只预取posts数据，tags会从posts中提取
	void queryClient.prefetchQuery(postsOptions('BLOG'))

	return (
		<main>
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto max-w-7xl p-6">
					<h1 className="text-4xl font-bold mb-8">博客文章</h1>

					<Suspense fallback={<div>加载中...</div>}>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<PostGridClient type="BLOG" />
						</HydrationBoundary>
					</Suspense>
				</div>
			</div>
		</main>
	)
}
