'use client'

import Link from 'next/link'
import { useNavigationPreload } from '@/lib/hooks/useNavigationPreload'
import { ReactNode } from 'react'

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
	const { preloadAndNavigate } = useNavigationPreload()

	const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
		// 调用自定义onClick
		onClick?.(e)

		await preloadAndNavigate(href)
	}

	return (
		<Link href={href} className={className} onClick={handleClick} {...props}>
			{children}
		</Link>
	)
}
