import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { fetchPostBySlugAction } from '@/lib/actions/content'
import { contentKeys } from '@/lib/content-queries'

export function useNavigationPreload() {
	const router = useRouter()
	const queryClient = useQueryClient()
	const [isPreloading, setIsPreloading] = useState(false)

	const preloadData = useCallback(
		async (path: string) => {
			// 检查是否是blog详情页
			const blogMatch = path.match(/^\/blog\/(.+)$/)

			if (blogMatch) {
				const slug = blogMatch[1]

				// Prefetch the post data using TanStack Query
				await queryClient.prefetchQuery({
					queryKey: contentKeys.post(slug),
					queryFn: () => fetchPostBySlugAction(slug),
					staleTime: 5 * 60 * 1000, // 5 minutes
				})
				return
			}
		},
		[queryClient],
	)

	const preloadAndNavigate = useCallback(
		async (href: string) => {
			// 开始预加载状态
			setIsPreloading(true)

			try {
				await preloadData(href)
				router.push(href)
			} catch (error) {
				console.error('Navigation error:', error)
				router.push(href)
			} finally {
				setIsPreloading(false)
			}
		},
		[preloadData, router],
	)

	return {
		isPreloading,
		preloadAndNavigate,
	}
}
