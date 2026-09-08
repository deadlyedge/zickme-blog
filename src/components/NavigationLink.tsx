'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useNavigationPreload } from '@/lib/hooks/useNavigationPreload'

interface NavigationLinkProps
	extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
	href: string
	children: ReactNode
	prefetch?: boolean
}

export function NavigationLink({
	href,
	children,
	className,
	onClick,
	onMouseEnter,
	prefetch = true,
	...props
}: NavigationLinkProps) {
	const { preloadAndNavigate, preloadData } = useNavigationPreload()

	const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
		onMouseEnter?.(e)
		preloadData(href)
	}

	const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 调用自定义onClick
		onClick?.(e)

		await preloadAndNavigate(href)
	}

	return (
		<Link
			href={href}
			prefetch={prefetch}
			className={className}
			onMouseEnter={handleMouseEnter}
			onClick={handleClick}
			{...props}
		>
			{children}
		</Link>
	)
}
