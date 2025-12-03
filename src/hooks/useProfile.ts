import { useQuery } from '@tanstack/react-query'
import type { ProfileViewModel } from '@/lib/content-providers'

const fetchProfile = async (): Promise<ProfileViewModel | null> => {
	const response = await fetch('/api/profile')
	if (!response.ok) {
		throw new Error('Failed to fetch profile')
	}
	return response.json()
}

export const useProfile = () => {
	return useQuery({
		queryKey: ['profile'],
		queryFn: fetchProfile,
		staleTime: 10 * 60 * 1000, // 10 minutes
	})
}
