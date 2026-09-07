import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { fetchPostBySlugAction } from '@/lib/actions/content'
import { contentKeys } from '@/lib/content-queries'
import { getQueryClient } from '@/lib/query-client'

export function useNavigationPreload() {
	const router = useRouter()
	const [isPreloading, setIsPreloading] = useState(false)

	const preloadAndNavigate = useCallback(
		async (path: string) => {
			// 检查是否是 posts 详情页
			const postMatch = path.match(/^\/(?:posts|blog|projects)\/(.+)$/)

			if (postMatch) {
				const slug = postMatch[1]
				const queryClient = getQueryClient()

				try {
					setIsPreloading(true)

					// 预取数据并放入 React Query 缓存
					await queryClient.prefetchQuery({
						queryKey: contentKeys.post(slug),
						queryFn: () => fetchPostBySlugAction(slug),
						staleTime: 5 * 60 * 1000,
					})
				} catch (error) {
					console.warn('Navigation preload failed:', error)
				} finally {
					setIsPreloading(false)
				}
			}

			// 执行路由跳转
			router.push(path)
		},
		[router],
	)

	return {
		preloadAndNavigate,
		isPreloading,
	}
}
