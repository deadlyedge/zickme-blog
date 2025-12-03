import { useQuery } from '@tanstack/react-query'
import type { ProjectViewModel } from '@/lib/content-providers'

const fetchProjects = async (): Promise<ProjectViewModel[]> => {
	const response = await fetch('/api/projects')
	if (!response.ok) {
		throw new Error('Failed to fetch projects')
	}
	return response.json()
}

export const useProjects = () => {
	return useQuery({
		queryKey: ['projects'],
		queryFn: fetchProjects,
		staleTime: 10 * 60 * 1000, // 10 minutes
	})
}
