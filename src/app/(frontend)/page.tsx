import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { fetchHomeContent } from '@/lib/content-providers'
import { HomePageClient } from '@/components/HomePageClient'

export default async function Home() {
	const queryClient = getQueryClient()
	await queryClient.prefetchQuery({
		queryKey: ['home-content'],
		queryFn: fetchHomeContent,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<HomePageClient />
		</HydrationBoundary>
	)
}
