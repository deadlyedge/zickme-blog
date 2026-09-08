'use client'

import { SearchIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { GlobalSearch } from './GlobalSearch'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export const HeaderNav = () => {
	const pathname = usePathname()
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const { data: session } = useSession()
	const openAuthModal = useAppStore((state) => state.openAuthModal)

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

	const userRole = (session?.user as { role?: string } | undefined)?.role

	return (
		<>
			<nav className="fixed w-full top-0 z-40 h-16 bg-white/60 dark:bg-background/80 backdrop-blur border-b">
				<div className="mx-auto max-w-7xl px-6 py-3 h-16 flex items-center justify-between">
					<Link
						href="/"
						className={cn(
							'text-lg font-semibold tracking-tight',
							pathname === '/' && 'text-primary',
						)}
					>
						zick.me
					</Link>

					<nav className="flex items-center font-bold font-sans text-base gap-1">
						<Button
							asChild
							variant={
								pathname.startsWith('/posts') ||
								pathname.startsWith('/blog') ||
								pathname.startsWith('/projects')
									? 'secondary'
									: 'link'
							}
							className="font-bold transition-all duration-200 hover:scale-105"
						>
							<Link href="/posts">posts</Link>
						</Button>
						<Button
							asChild
							variant={pathname.startsWith('/about') ? 'secondary' : 'link'}
							className="font-bold transition-all duration-200 hover:scale-105"
						>
							<Link href="/about">about</Link>
						</Button>

						{/* 登录/用户中心 入口 */}
						{session?.user ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										asChild
										variant={
											pathname.startsWith('/user') ||
											pathname.startsWith('/dashboard')
												? 'secondary'
												: 'ghost'
										}
										size="sm"
										className="h-8 px-2 gap-1.5 ml-1"
									>
										<Link href={userRole === 'ADMIN' ? '/dashboard' : '/user'}>
											<Avatar className="size-5">
												<AvatarImage
													src={session.user.image || ''}
													alt={session.user.name}
												/>
												<AvatarFallback className="text-[10px]">
													{session.user.name?.slice(0, 2).toUpperCase() || 'U'}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs max-w-[80px] truncate hidden sm:inline">
												{session.user.name}
											</span>
										</Link>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{userRole === 'ADMIN'
										? '管理控制台 (/dashboard)'
										: '用户个人中心 (/user)'}
								</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => openAuthModal('login')}
										className="h-8 px-2 gap-1 ml-1 text-xs"
									>
										<UserIcon className="size-3.5" />
										<span>登录</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>登录 / 注册</TooltipContent>
							</Tooltip>
						)}

						{/* 搜索按钮 */}
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsSearchOpen(true)}
									className="ml-1 h-8 w-8 p-0 text-primary hover:fill-white hover:bg-accent"
								>
									<SearchIcon className="h-4 w-4" />
									<span className="sr-only">搜索</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>搜索 (⌘K)</TooltipContent>
						</Tooltip>
					</nav>
				</div>
			</nav>

			{/* 全局搜索对话框 */}
			<GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
		</>
	)
}
