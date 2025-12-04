'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { ReactNode, useCallback, useState } from 'react'

interface NavigationLinkProps extends Omit<
	React.AnchorHTMLAttributes<HTMLAnchorElement>,
	'href'
> {
	href: string
	children: ReactNode
}

export function NavigationLink({
	href,
	children,
	className,
	onClick,
	...props
}: NavigationLinkProps) {
	const router = useRouter()
	const setNavigating = useAppStore((state) => state.setNavigating)
	const setCurrentPath = useAppStore((state) => state.setCurrentPath)
	const fetchBlogPost = useAppStore((state) => state.fetchBlogPost)
	const fetchProject = useAppStore((state) => state.fetchProject)
	// const preloading = useAppStore((state) => state.preloading)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isPreloading, setIsPreloading] = useState(false)

	const preloadData = useCallback(
		async (path: string) => {
			// 检查是否是blog或project详情页
			const blogMatch = path.match(/^\/blog\/(.+)$/)
			const projectMatch = path.match(/^\/projects\/(.+)$/)

			if (blogMatch) {
				const slug = blogMatch[1]
				await fetchBlogPost(slug)
				return
			}

			if (projectMatch) {
				const slug = projectMatch[1]
				await fetchProject(slug)
				return
			}
		},
		[fetchBlogPost, fetchProject],
	)

	const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 调用自定义onClick
		onClick?.(e)

		// 开始预加载状态
		setIsPreloading(true)
		setNavigating(true)

		// 立即触发路由跳转，Next.js 的 prefetching 会处理一部分，
		// 而我们的 prefetchData 只是为了让 Zustand Store 提前有数据。
		// 我们不想因为数据加载而阻塞页面跳转的直观感受（虽然我们用了 setNavigating 显示 loading）。
		// 但为了利用 store 缓存，我们还是等待一下比较好。

		try {
			// 并行执行：数据获取和路由跳转准备
			// 但实际上我们希望数据好了再跳转，或者利用 Suspense。
			// 这里的逻辑是：先获取数据，如果很快就好，就跳转展示完整页面。
			// 如果慢，loading state 会显示。

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
	}

	return (
		<Link href={href} className={className} onClick={handleClick} {...props}>
			{children}
		</Link>
	)
}
