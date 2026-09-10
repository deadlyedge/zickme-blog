'use client'

import { BookOpen, SearchIcon, User, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { signOut, useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'

import { BrandLogo } from './BrandLogo'
import { GlobalSearch } from './GlobalSearch'
import { UserDropdownMenu } from './UserDropdownMenu'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export const HeaderNav = () => {
	const pathname = usePathname()
	const router = useRouter()
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

	// Dashboard 使用独立的 DashboardNavHeader，避免与全局 fixed navbar 重叠。
	if (pathname.startsWith('/dashboard')) {
		return null
	}

	const handleSignOut = async () => {
		try {
			await signOut()
			toast.success('已安全退出登录')
			router.push('/')
			router.refresh()
		} catch (_error) {
			toast.error('退出登录失败')
		}
	}

	return (
		<>
			<nav className="fixed w-full top-0 z-40 h-16 bg-white/70 dark:bg-background/80 backdrop-blur-md border-b">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 h-16 flex items-center justify-between">
					<Link
						href="/"
						className="group inline-flex items-center"
						aria-label="返回首页"
					>
						<BrandLogo
							size={32}
							textClassName="text-lg font-black tracking-tight"
						/>
					</Link>

					<nav className="flex items-center font-bold font-sans text-base gap-1 sm:gap-2">
						<Button
							asChild
							variant={
								pathname.startsWith('/posts') ||
								pathname.startsWith('/blog') ||
								pathname.startsWith('/projects')
									? 'secondary'
									: 'ghost'
							}
							size="sm"
							className="font-bold transition-all duration-200"
						>
							<Link href="/posts" className="gap-1.5">
								<BookOpen className="size-4 opacity-70" />
								<span>posts</span>
							</Link>
						</Button>
						<Button
							asChild
							variant={pathname.startsWith('/about') ? 'secondary' : 'ghost'}
							size="sm"
							className="font-bold transition-all duration-200"
						>
							<Link href="/about" className="gap-1.5">
								<User className="size-4 opacity-70" />
								<span>about</span>
							</Link>
						</Button>

						{/* 登录态 / 用户下拉菜单 */}
						{session?.user ? (
							<UserDropdownMenu onSignOut={handleSignOut} />
						) : (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => openAuthModal('login')}
										className="h-8 px-2.5 gap-1.5 ml-1 text-xs font-semibold rounded-full border border-border/50"
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
									className="ml-1 h-8 w-8 p-0 text-primary hover:fill-white hover:bg-accent rounded-full border border-border/50"
								>
									<SearchIcon className="h-4 w-4" />
									<span className="sr-only">搜索</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>搜索 [⌘K]</TooltipContent>
						</Tooltip>
					</nav>
				</div>
			</nav>

			{/* 全局搜索对话框 */}
			<GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
		</>
	)
}
