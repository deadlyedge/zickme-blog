'use client'

import { useHomeContent } from '@/hooks/useHomeContent'
import { HomeScrollArea } from '@/components/HomeScrollArea'

export function HomePageClient() {
	const { data, isLoading, error } = useHomeContent()

	if (isLoading) {
		return <div className="flex items-center justify-center min-h-screen">Loading...</div>
	}

	if (error) {
		return <div className="flex items-center justify-center min-h-screen">Error loading content</div>
	}

	if (!data) {
		return <div className="flex items-center justify-center min-h-screen">No data</div>
	}

	return <HomeScrollArea data={data} />
}
