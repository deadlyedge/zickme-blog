import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { AboutPageClient } from '@/components/AboutPageClient'
import { fetchProfile } from '@/lib/content-providers'

export default async function AboutPage() {
	const queryClient = getQueryClient()

	// Prefetch profile data
	await queryClient.prefetchQuery({
		queryKey: ['profile'],
		queryFn: fetchProfile,
		staleTime: 10 * 60 * 1000,
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AboutPageClient />
		</HydrationBoundary>
	)
}
