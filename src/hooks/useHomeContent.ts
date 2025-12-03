import { useQuery } from '@tanstack/react-query'
import type { ContentResponse } from '@/lib/content-providers'

export const fetchHomeContent = async (): Promise<ContentResponse> => {
	const response = await fetch('/api/home-content')
	if (!response.ok) {
		throw new Error('Failed to fetch home content')
	}
	return response.json()
}

export const useHomeContent = () => {
	return useQuery({
		queryKey: ['home-content'],
		queryFn: fetchHomeContent,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}
