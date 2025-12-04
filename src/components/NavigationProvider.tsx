'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createContext, useContext, useCallback, useState, ReactNode } from 'react'

interface NavigationContextType {
	isNavigating: boolean
	currentPath: string
	navigate: (path: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const [isNavigating, setIsNavigating] = useState(false)

	const navigate = useCallback((path: string) => {
		if (path !== pathname) {
			setIsNavigating(true)
			router.push(path)

			// 延迟重置导航状态，给loading动画足够时间
			setTimeout(() => setIsNavigating(false), 200)
		}
	}, [pathname, router])

	return (
		<NavigationContext.Provider value={{
			isNavigating,
			currentPath: pathname,
			navigate
		}}>
			{children}
		</NavigationContext.Provider>
	)
}

export function useNavigation() {
	const context = useContext(NavigationContext)
	if (context === undefined) {
		throw new Error('useNavigation must be used within a NavigationProvider')
	}
	return context
}
