'use client'

import {
	BarChart3,
	FileText,
	HardDriveUpload,
	LogOut,
	Palette,
	Shield,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type React from 'react'
import { toast } from 'sonner'
import { EditProfile } from '@/components/dashboard/EditProfile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
	{
		title: '概览看板',
		href: '/dashboard',
		icon: BarChart3,
		exact: true,
	},
	{
		title: '文章管理',
		href: '/dashboard/posts',
		icon: FileText,
		exact: false,
	},
	{
		title: '导入与同步',
		href: '/dashboard/sync',
		icon: HardDriveUpload,
		exact: false,
	},
	{
		title: '站点与主题',
		href: '/dashboard/settings',
		icon: Palette,
		exact: false,
	},
	{
		title: '用户权限',
		href: '/dashboard/users',
		icon: Users,
		exact: false,
	},
]

export const DashboardNavHeader: React.FC = () => {
	const pathname = usePathname()
	const router = useRouter()
	const { data: session } = useSession()

	const handleSignOut = async () => {
		try {
			await signOut()
			toast.success('已安全退出管理后台')
			router.push('/')
			router.refresh()
		} catch (_error) {
			toast.error('退出登录失败')
		}
	}

	return (
		<div className="border-b bg-card/75 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
			<div className="container mx-auto px-4 sm:px-6">
				{/* 顶部主条 */}
				<div className="flex items-center justify-between h-16 gap-4">
					<div className="flex items-center gap-3">
						<Link
							href="/dashboard"
							className="flex items-center gap-2 font-black text-lg tracking-tight group"
						>
							<span className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-xs group-hover:scale-105 transition-transform">
								<Shield className="size-4" />
							</span>
							<span className="hidden sm:inline">管理控制台</span>
						</Link>
						<Badge
							variant="outline"
							className="text-[10px] font-mono uppercase tracking-widest hidden md:inline-flex"
						>
							Admin Console
						</Badge>
					</div>

					{/* 快捷操作与用户信息 */}
					<div className="flex items-center gap-2 sm:gap-3">
						<EditProfile />

						<div className="h-4 w-px bg-border hidden sm:block" />

						{session?.user && (
							<div className="flex items-center gap-2 pl-1">
								<Avatar className="size-7 ring-1 ring-border">
									<AvatarImage
										src={session.user.image || ''}
										alt={session.user.name}
									/>
									<AvatarFallback className="text-[10px] font-bold">
										{session.user.name?.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="text-xs font-semibold max-w-[80px] truncate hidden md:inline">
									{session.user.name}
								</span>
							</div>
						)}

						<Button
							variant="ghost"
							size="sm"
							onClick={handleSignOut}
							className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-lg"
						>
							<LogOut className="size-3.5" />
							<span className="hidden sm:inline">退出</span>
						</Button>
					</div>
				</div>

				{/* 次级横向胶囊导航条 */}
				<div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon
						const isActive = item.exact
							? pathname === item.href
							: pathname === item.href || pathname.startsWith(`${item.href}/`)

						return (
							<Button
								key={item.href}
								asChild
								variant={isActive ? 'default' : 'ghost'}
								size="sm"
								className={cn(
									'h-8 px-3 text-xs font-semibold rounded-lg shrink-0 gap-1.5 transition-all',
									isActive
										? 'shadow-xs'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted/80',
								)}
							>
								<Link href={item.href}>
									<Icon className="size-3.5" />
									<span>{item.title}</span>
								</Link>
							</Button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
