'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePosts, useTags } from '@/lib/hooks/useContent'

interface SmartCacheContextType {
	isDataReady: boolean
}

const SmartCacheContext = createContext<SmartCacheContextType | undefined>(
	undefined,
)

export function SmartCacheProvider({ children }: { children: ReactNode }) {
	// Use TanStack Query to check if data is ready
	const { data: posts, isSuccess: postsReady } = usePosts()
	const { data: tags, isSuccess: tagsReady } = useTags()

	// 检查是否所有关键数据都已加载
	const isDataReady = postsReady && tagsReady && posts && posts.length > 0 && tags && tags.length > 0

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
