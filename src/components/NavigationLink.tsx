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
	const {
		setNavigating,
		setCurrentPath,
		setPreloadingBlog,
		setPreloadingProject,
		setSingleBlogPost,
		setSingleProject,
		isSingleContentCached,
		preloading,
	} = useAppStore()

	const [isPreloading, setIsPreloading] = useState(false)

	const preloadData = useCallback(
		async (path: string): Promise<boolean> => {
			// 检查是否是blog或project详情页
			const blogMatch = path.match(/^\/blog\/(.+)$/)
			const projectMatch = path.match(/^\/projects\/(.+)$/)

			if (blogMatch) {
				const slug = blogMatch[1]
				// 检查是否已经在缓存中或正在预加载
				if (isSingleContentCached('blog', slug)) {
					return true // 数据已准备好
				}

				if (preloading.blogPost === slug) {
					// 等待预加载完成
					return new Promise((resolve) => {
						const checkPreloading = () => {
							if (preloading.blogPost !== slug) {
								resolve(true)
							} else {
								setTimeout(checkPreloading, 100)
							}
						}
						checkPreloading()
					})
				}

				// 开始预加载
				setPreloadingBlog(slug)
				try {
					const response = await fetch(`/api/blog/${slug}`)
					if (response.ok) {
						const postData = await response.json()
						setSingleBlogPost(slug, postData)
						return true
					}
					return false
				} catch (error) {
					console.error('Failed to preload blog post:', error)
					return false
				} finally {
					setPreloadingBlog(null)
				}
			}

			if (projectMatch) {
				const slug = projectMatch[1]
				// 检查是否已经在缓存中或正在预加载
				if (isSingleContentCached('project', slug)) {
					return true // 数据已准备好
				}

				if (preloading.project === slug) {
					// 等待预加载完成
					return new Promise((resolve) => {
						const checkPreloading = () => {
							if (preloading.project !== slug) {
								resolve(true)
							} else {
								setTimeout(checkPreloading, 100)
							}
						}
						checkPreloading()
					})
				}

				// 开始预加载
				setPreloadingProject(slug)
				try {
					const response = await fetch(`/api/projects/${slug}`)
					if (response.ok) {
						const projectData = await response.json()
						setSingleProject(slug, projectData)
						return true
					}
					return false
				} catch (error) {
					console.error('Failed to preload project:', error)
					return false
				} finally {
					setPreloadingProject(null)
				}
			}

			// 不是详情页，直接返回true
			return true
		},
		[
			isSingleContentCached,
			preloading,
			setPreloadingBlog,
			setPreloadingProject,
			setSingleBlogPost,
			setSingleProject,
		],
	)

	const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 调用自定义onClick
		onClick?.(e)

		// 开始预加载状态
		setIsPreloading(true)
		setNavigating(true)

		try {
			// 等待数据预加载完成
			const dataReady = await preloadData(href)

			if (dataReady) {
				// 数据准备好后，设置路径并导航
				setCurrentPath(href)
				router.push(href)
			} else {
				// 数据加载失败，仍然尝试导航
				setCurrentPath(href)
				router.push(href)
			}
		} catch (error) {
			console.error('Navigation error:', error)
			// 即使出错也要导航
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
