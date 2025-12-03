import { notFound } from 'next/navigation'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { ProjectPageClient } from '@/components/ProjectPageClient'
import { fetchContent } from '@/lib/content-providers'
import { getComments } from '@/lib/actions/comments'

type ProjectPageProps = {
	params: Promise<{
		slug: string
	}>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
	const { slug } = await params
	const queryClient = getQueryClient()

	// Check if project exists
	const { projects } = await fetchContent()
	const project = projects.find((p) => p.slug === slug)

	if (!project) {
		notFound()
	}

	// Prefetch project data
	await queryClient.prefetchQuery({
		queryKey: ['project', slug],
		queryFn: async () => {
			const { projects } = await fetchContent()
			return projects.find((p) => p.slug === slug) || null
		},
		staleTime: 10 * 60 * 1000,
	})

	// Prefetch comments data
	await queryClient.prefetchQuery({
		queryKey: ['comments', 'projects', project.id],
		queryFn: () => getComments(project.id, 'projects'),
		staleTime: 2 * 60 * 1000,
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<ProjectPageClient slug={slug} />
		</HydrationBoundary>
	)
}
