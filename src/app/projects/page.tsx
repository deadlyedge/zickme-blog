import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PostGridClient } from '@/components/PostGridClient'
import { postsOptions, tagsOptions } from '@/lib/content-queries'
import { getQueryClient } from '@/lib/query-client'
import { buildMetadata } from '@/lib/seo'

// 每5分钟重新验证一次
export const revalidate = 300

export const metadata: Metadata = buildMetadata({
	title: '我的项目',
	description: '浏览我的所有项目文章',
})

export default function ProjectsPage() {
	const queryClient = getQueryClient()

	// 预取数据
	void queryClient.prefetchQuery(postsOptions('PROJECT'))
	void queryClient.prefetchQuery(tagsOptions())

	return (
		<main>
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto max-w-7xl p-6">
					<h1 className="text-4xl font-bold mb-8">我的项目</h1>

					<Suspense fallback={<div>加载中...</div>}>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<PostGridClient type="PROJECT" />
						</HydrationBoundary>
					</Suspense>
				</div>
			</div>
		</main>
	)
}
