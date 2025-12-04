'use client'

import { useNavigation } from './NavigationProvider'

export function PageTransition({ children }: { children: React.ReactNode }) {
	const { isNavigating } = useNavigation()

	if (isNavigating) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		)
	}

	return (
		<div className="transition-all duration-300 ease-in-out">
			{children}
		</div>
	)
}
