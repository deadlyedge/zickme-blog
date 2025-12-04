'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { ReactNode } from 'react'

interface NavigationLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
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
	const { setNavigating, setCurrentPath } = useAppStore()

	const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 调用自定义onClick
		onClick?.(e)

		// 立即设置导航状态
		setNavigating(true)
		setCurrentPath(href)

		try {
			// 执行导航
			router.push(href)
		} catch (error) {
			console.error('Navigation error:', error)
		} finally {
			// 延迟重置状态，给UI足够时间响应
			setTimeout(() => setNavigating(false), 200)
		}
	}

	return (
		<Link
			href={href}
			className={className}
			onClick={handleClick}
			{...props}
		>
			{children}
		</Link>
	)
}
