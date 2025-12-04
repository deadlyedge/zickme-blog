'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

interface SmartCacheContextType {
	isDataReady: boolean
}

const SmartCacheContext = createContext<SmartCacheContextType | undefined>(undefined)

export function SmartCacheProvider({ children }: { children: ReactNode }) {
	const hasBlogPosts = useAppStore((state) => state.blogPosts.size > 0)
	const hasProjects = useAppStore((state) => state.projects.size > 0)
	const hasTags = useAppStore((state) => state.tags.length > 0)

	// 检查是否所有关键数据都已加载
	const isDataReady = hasBlogPosts && hasProjects && hasTags

	return (
		<SmartCacheContext.Provider value={{ isDataReady }}>
			{children}
		</SmartCacheContext.Provider>
	)
}

export function useSmartCache() {
	const context = useContext(SmartCacheContext)
	if (context === undefined) {
		throw new Error('useSmartCache must be used within a SmartCacheProvider')
	}
	return context
}
