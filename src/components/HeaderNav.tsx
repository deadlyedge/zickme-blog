'use client'

import {
	Bell,
	BookOpen,
	FileText,
	HardDriveUpload,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Palette,
	SearchIcon,
	Shield,
	User,
	UserCheck,
	UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { signOut, useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { GlobalSearch } from './GlobalSearch'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu'
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

	const userRole = (session?.user as { role?: string } | undefined)?.role
	const isAdmin = userRole === 'ADMIN'

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
						className={cn(
							'text-lg font-black tracking-tight flex items-center gap-2',
							pathname === '/' && 'text-primary',
						)}
					>
						<span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
							zick.me
						</span>
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
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											'h-9 px-2 gap-2 rounded-full border border-border/60 hover:bg-accent hover:border-primary/40 transition-all',
											(pathname.startsWith('/user') ||
												pathname.startsWith('/dashboard')) &&
												'bg-secondary border-primary/40 shadow-xs',
										)}
									>
										<Avatar className="size-6 ring-1 ring-border">
											<AvatarImage
												src={session.user.image || ''}
												alt={session.user.name}
											/>
											<AvatarFallback className="text-[10px] font-bold">
												{session.user.name?.slice(0, 2).toUpperCase() || 'U'}
											</AvatarFallback>
										</Avatar>
										<span className="text-xs font-semibold max-w-22.5 truncate hidden sm:inline">
											{session.user.name}
										</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-60 p-2 shadow-xl">
									{/* 头部用户信息 */}
									<div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 mb-1">
										<Avatar className="size-9">
											<AvatarImage
												src={session.user.image || ''}
												alt={session.user.name}
											/>
											<AvatarFallback>
												{session.user.name?.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col min-w-0">
											<div className="flex items-center gap-1.5">
												<span className="text-sm font-bold truncate">
													{session.user.name}
												</span>
												<Badge
													variant={isAdmin ? 'default' : 'secondary'}
													className="text-[10px] px-1.5 py-0 h-4 font-mono uppercase"
												>
													{isAdmin ? 'Admin' : 'User'}
												</Badge>
											</div>
											<span className="text-xs text-muted-foreground truncate">
												{session.user.email}
											</span>
										</div>
									</div>

									<DropdownMenuSeparator />

									{/* 管理员专属菜单 */}
									{isAdmin && (
										<>
											<DropdownMenuLabel className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1">
												管理中心
											</DropdownMenuLabel>
											<DropdownMenuGroup>
												<DropdownMenuItem asChild>
													<Link
														href="/dashboard"
														className="flex items-center gap-2 cursor-pointer"
													>
														<LayoutDashboard className="size-4 text-primary" />
														<span>仪表板概览</span>
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link
														href="/dashboard/posts"
														className="flex items-center gap-2 cursor-pointer"
													>
														<FileText className="size-4 text-primary" />
														<span>文章管理</span>
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link
														href="/dashboard/sync"
														className="flex items-center gap-2 cursor-pointer"
													>
														<HardDriveUpload className="size-4 text-primary" />
														<span>导入与同步</span>
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link
														href="/dashboard/settings"
														className="flex items-center gap-2 cursor-pointer"
													>
														<Palette className="size-4 text-primary" />
														<span>站点与主题定制</span>
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link
														href="/dashboard/users"
														className="flex items-center gap-2 cursor-pointer"
													>
														<UserCheck className="size-4 text-primary" />
														<span>用户权限管理</span>
													</Link>
												</DropdownMenuItem>
											</DropdownMenuGroup>
											<DropdownMenuSeparator />
										</>
									)}

									{/* 普通用户 & 通用用户中心 */}
									<DropdownMenuLabel className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-1">
										个人中心
									</DropdownMenuLabel>
									<DropdownMenuGroup>
										<DropdownMenuItem asChild>
											<Link
												href="/user"
												className="flex items-center gap-2 cursor-pointer"
											>
												<Shield className="size-4 text-muted-foreground" />
												<span>个人设置与安全</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link
												href="/user?tab=comments"
												className="flex items-center gap-2 cursor-pointer"
											>
												<MessageSquare className="size-4 text-muted-foreground" />
												<span>我的评论历史</span>
											</Link>
										</DropdownMenuItem>
										<DropdownMenuItem asChild>
											<Link
												href="/user?tab=replies"
												className="flex items-center gap-2 cursor-pointer"
											>
												<Bell className="size-4 text-muted-foreground" />
												<span>互动回复提醒</span>
											</Link>
										</DropdownMenuItem>
									</DropdownMenuGroup>

									<DropdownMenuSeparator />

									{/* 退出登录 */}
									<DropdownMenuItem
										onClick={handleSignOut}
										className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
									>
										<LogOut className="size-4" />
										<span>退出登录</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
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
