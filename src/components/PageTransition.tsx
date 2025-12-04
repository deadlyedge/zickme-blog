'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const [displayPath, setDisplayPath] = useState(pathname)

	useLayoutEffect(() => {
		if (pathname !== displayPath) {
			// 短暂延迟以允许loading状态显示
			const timer = setTimeout(() => setDisplayPath(pathname), 50)
			return () => clearTimeout(timer)
		}
	}, [pathname, displayPath])

	return (
		<div className="transition-all duration-200 ease-out">
			{children}
		</div>
	)
}
