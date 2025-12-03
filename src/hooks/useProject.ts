import { useQuery } from '@tanstack/react-query'
import type { ProjectViewModel } from '@/lib/content-providers'

const fetchProjectBySlug = async (slug: string): Promise<ProjectViewModel | null> => {
	const response = await fetch(`/api/projects/${slug}`)
	if (!response.ok) {
		if (response.status === 404) {
			return null
		}
		throw new Error('Failed to fetch project')
	}
	return response.json()
}

export const useProject = (slug: string) => {
	return useQuery({
		queryKey: ['project', slug],
		queryFn: () => fetchProjectBySlug(slug),
		staleTime: 10 * 60 * 1000, // 10 minutes
		enabled: !!slug,
	})
}
