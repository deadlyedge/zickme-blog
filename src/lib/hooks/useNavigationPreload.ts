import { useAppStore } from '@/lib/store'
import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useNavigationPreload() {
	const router = useRouter()
	const setNavigating = useAppStore((state) => state.setNavigating)
	const setCurrentPath = useAppStore((state) => state.setCurrentPath)
	const fetchPost = useAppStore((state) => state.fetchPost)

	const [isPreloading, setIsPreloading] = useState(false)

	const preloadData = useCallback(
		async (path: string) => {
			// 检查是否是blog详情页
			const blogMatch = path.match(/^\/blog\/(.+)$/)

			if (blogMatch) {
				const slug = blogMatch[1]
				await fetchPost(slug)
				return
			}
		},
		[fetchPost],
	)

	const preloadAndNavigate = useCallback(
		async (href: string) => {
			// 开始预加载状态
			setIsPreloading(true)
			setNavigating(true)

			try {
				await preloadData(href)
				setCurrentPath(href)
				router.push(href)
			} catch (error) {
				console.error('Navigation error:', error)
				setCurrentPath(href)
				router.push(href)
			} finally {
				setIsPreloading(false)
				// 延迟重置导航状态
				setTimeout(() => setNavigating(false), 200)
			}
		},
		[preloadData, router, setNavigating, setCurrentPath],
	)

	return {
		isPreloading,
		preloadAndNavigate,
	}
}
