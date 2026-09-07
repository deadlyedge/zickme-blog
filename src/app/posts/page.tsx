import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PostGridClient } from '@/components/PostGridClient'
import { postsOptions, tagsOptions } from '@/lib/content-queries'
import { getQueryClient } from '@/lib/query-client'
import { buildMetadata } from '@/lib/seo'

// 5分钟重新验证一次
export const revalidate = 300

export const metadata: Metadata = buildMetadata({
	title: '所有文章',
	description: '浏览所有文章与技术分享',
})

export default function PostsPage() {
	const queryClient = getQueryClient()

	void queryClient.query(postsOptions())
	void queryClient.query(tagsOptions())

	return (
		<main>
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto max-w-7xl p-6">
					<h1 className="text-4xl font-bold mb-8">所有文章</h1>

					<Suspense fallback={<div>加载中...</div>}>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<PostGridClient />
						</HydrationBoundary>
					</Suspense>
				</div>
			</div>
		</main>
	)
}
