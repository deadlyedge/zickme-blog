'use client'

import { Aperture, BookOpen, SearchIcon, User, UserIcon } from 'lucide-react'
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

	const isGallery = pathname.startsWith('/gallery')
	const navClass = isGallery
		? 'bg-[#242424]/85 text-white border-white/10'
		: 'bg-white/70 dark:bg-background/80 border-border'
	const mutedNavClass = isGallery
		? 'text-white/75 hover:text-white hover:bg-white/10'
		: 'text-primary'

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
			<nav
				className={`fixed w-full top-0 z-40 h-16 backdrop-blur-md border-b transition-colors duration-300 ${navClass}`}
			>
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
					<Link
						href="/"
						className="group inline-flex shrink-0 items-center"
						aria-label="返回首页"
					>
						<BrandLogo
							size={28}
							textClassName={`text-base font-black tracking-tight sm:text-lg ${isGallery ? 'text-[#d4d4d4] [&_.text-primary]:text-[#d4d4d4]' : ''}`}
						/>
					</Link>

					<nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto font-sans text-base font-bold scrollbar-none sm:gap-2">
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
							<Link href="/posts" aria-label="posts" className="gap-1.5">
								<BookOpen className="size-4 opacity-70" />
								<span className="hidden sm:inline">posts</span>
							</Link>
						</Button>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className={`font-bold transition-all duration-200 ${isGallery ? 'bg-white/12 text-white' : ''}`}
						>
							<Link href="/gallery" aria-label="gallery" className="gap-1.5">
								<Aperture className="size-4 opacity-70" />
								<span className="hidden sm:inline">gallery</span>
							</Link>
						</Button>
						<Button
							asChild
							variant={pathname.startsWith('/about') ? 'secondary' : 'ghost'}
							size="sm"
							className="font-bold transition-all duration-200"
						>
							<Link href="/about" aria-label="about" className="gap-1.5">
								<User className="size-4 opacity-70" />
								<span className="hidden sm:inline">about</span>
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
										className="ml-0 h-8 gap-1.5 rounded-full border border-border/50 px-2.5 text-xs font-semibold sm:ml-1"
									>
										<UserIcon className="size-3.5" />
										<span className="hidden sm:inline">登录</span>
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
									className={`ml-1 h-8 w-8 p-0 rounded-full border ${mutedNavClass} ${isGallery ? 'border-white/15' : 'border-border/50'}`}
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
