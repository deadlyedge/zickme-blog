import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { buildMetadata } from '@/lib/seo'
import { Metadata } from 'next'
import { getQueryClient } from '@/lib/query-client'
import { homeContentOptions } from '@/lib/content-queries'
import { HomeScrollArea } from '@/components/HomeScrollArea'

export const revalidate = 3600 // 每小时重新验证一次，确保内容及时更新

export const metadata: Metadata = buildMetadata({
	title: 'Zickme Home',
	description: 'Welcome to my personal blog and portfolio website.',
})

export default function HomePage() {
	const queryClient = getQueryClient()

	// 预取首页数据
	void queryClient.prefetchQuery(homeContentOptions())

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomeScrollArea />
		</HydrationBoundary>
	)
}
