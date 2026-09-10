'use client'

import {
	Bell,
	FileText,
	HardDriveUpload,
	LayoutDashboard,
	LogOut,
	MessageSquare,
	Palette,
	Shield,
	UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
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

type UserDropdownMenuProps = {
	onSignOut: () => void | Promise<void>
}

export const UserDropdownMenu = ({ onSignOut }: UserDropdownMenuProps) => {
	const pathname = usePathname()
	const { data: session } = useSession()
	const userRole = (session?.user as { role?: string } | undefined)?.role
	const isAdmin = userRole === 'ADMIN'

	if (!session?.user) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						'h-9 px-2 gap-2 rounded-full border border-border/60 hover:bg-accent hover:border-primary/40 transition-all',
						pathname.startsWith('/user') &&
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
				<DropdownMenuItem
					onClick={onSignOut}
					className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
				>
					<LogOut className="size-4" />
					<span>退出登录</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
