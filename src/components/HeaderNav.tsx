'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { SearchIcon } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'

export const HeaderNav = () => {
	const pathname = usePathname()
	const [isSearchOpen, setIsSearchOpen] = useState(false)

	// 全局键盘快捷键监听
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault()
				setIsSearchOpen(true)
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [])

	return (
		<>
			<nav className="fixed w-full top-0 z-40 h-16 bg-white/60 backdrop-blur border-b">
				<div className="mx-auto max-w-7xl px-6 py-3 h-16 flex items-center justify-between">
					<Link
						href="/"
						className={cn(
							'text-lg font-semibold tracking-tight',
							pathname === '/' && 'text-primary',
						)}>
						{/* {profile?.website?.split('://')[1]?.replace(/\/$/, '') ?? 'Your Name'} */}
						zick.me
					</Link>

					<nav className="flex items-center font-bold font-sans text-base gap-1">
						<Button
							asChild
							variant={pathname.startsWith('/projects') ? 'secondary' : 'link'}
							className="font-bold transition-all duration-200 hover:scale-105">
							<Link href="/projects">projects</Link>
						</Button>
						<Button
							asChild
							variant={pathname.startsWith('/blog') ? 'secondary' : 'link'}
							className="font-bold transition-all duration-200 hover:scale-105">
							<Link href="/blog">blog</Link>
						</Button>
						<Button
							asChild
							variant={pathname.startsWith('/about') ? 'secondary' : 'link'}
							className="font-bold transition-all duration-200 hover:scale-105">
							<Link href="/about">about</Link>
						</Button>

						{/* 搜索按钮 */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setIsSearchOpen(true)}
							className="ml-2 h-8 w-8 p-0 text-primary hover:fill-white hover:bg-accent"
							title="搜索 (⌘K)">
							<SearchIcon className="h-4 w-4" />
							<span className="sr-only">搜索</span>
						</Button>
					</nav>
				</div>
			</nav>

			{/* 全局搜索对话框 */}
			<GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
		</>
	)
}
