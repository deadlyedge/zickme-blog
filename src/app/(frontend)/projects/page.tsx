import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { ProjectsPageClient } from '@/components/ProjectsPageClient'
import { fetchProjects } from '@/lib/content-providers'

export default async function ProjectsPage() {
	const queryClient = getQueryClient()

	// Prefetch projects data
	await queryClient.prefetchQuery({
		queryKey: ['projects'],
		queryFn: fetchProjects,
		staleTime: 10 * 60 * 1000,
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ProjectsPageClient />
		</HydrationBoundary>
	)
}
