import { FileText, MessageSquare, Palette, Users } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ActiveUsersList } from '@/components/dashboard/ActiveUsersList'
import { PopularPostsList } from '@/components/dashboard/PopularPostsList'
import { RecentCommentsList } from '@/components/dashboard/RecentCommentsList'
import { StatCard } from '@/components/dashboard/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user.id || session.user.role !== 'ADMIN') redirect('/')

	const stats = await getDashboardStats()

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-8 max-w-7xl">
			{/* 头部欢迎标语 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-linear-to-r from-card via-card to-muted/40 border shadow-xs">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl sm:text-3xl font-black tracking-tight">
							概览看板
						</h1>
						<Badge variant="secondary" className="font-mono text-xs">
							Live Data
						</Badge>
					</div>
					<p className="text-xs sm:text-sm text-muted-foreground">
						欢迎回来，{session.user.name}
						。这里是全站核心运营指标与最新数据动态。
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button asChild size="sm" className="text-xs shadow-xs">
						<Link href="/dashboard/posts">
							<FileText className="size-3.5 mr-1.5" />
							管理文章
						</Link>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				<StatCard
					title="总用户数"
					value={stats.overview.totalUsers}
					description="注册用户总数"
					icon={<Users className="h-4 w-4" />}
					iconClassName="p-2 rounded-xl bg-blue-500/10 text-blue-600"
				/>
				<StatCard
					title="全站互动"
					value={stats.overview.totalComments}
					description="读者发表的所有评论"
					icon={<MessageSquare className="h-4 w-4" />}
					iconClassName="p-2 rounded-xl bg-purple-500/10 text-purple-600"
				/>
				<StatCard
					title="文章总数"
					value={stats.overview.totalPosts}
					description="全站已收录文章篇数"
					icon={<FileText className="h-4 w-4" />}
					iconClassName="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"
				/>
				<StatCard
					title="标签分类"
					value={stats.overview.totalTags}
					description="关联标签与维度分类"
					icon={<Palette className="h-4 w-4" />}
					iconClassName="p-2 rounded-xl bg-amber-500/10 text-amber-600"
				/>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<PopularPostsList posts={stats.topCommentedPosts} />
				<ActiveUsersList users={stats.topCommentingUsers} />
			</div>

			<RecentCommentsList comments={stats.recentComments} />
		</div>
	)
}
