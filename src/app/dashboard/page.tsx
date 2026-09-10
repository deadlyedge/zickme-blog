import {
	Eye,
	FileText,
	HardDriveUpload,
	MessageSquare,
	Palette,
	TrendingUp,
	UserCog,
	Users,
} from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
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
					<Button
						asChild
						variant="outline"
						size="sm"
						className="text-xs shadow-2xs"
					>
						<Link href="/dashboard/sync">
							<HardDriveUpload className="size-3.5 mr-1.5 text-primary" />
							快速同步
						</Link>
					</Button>
					<Button asChild size="sm" className="text-xs shadow-xs">
						<Link href="/dashboard/posts">
							<FileText className="size-3.5 mr-1.5" />
							管理文章
						</Link>
					</Button>
				</div>
			</div>

			{/* 统计指标卡片 */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				<Card className="hover:border-primary/40 transition-colors shadow-2xs">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">总用户数</CardTitle>
						<div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
							<Users className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black tracking-tight">
							{stats.overview.totalUsers}
						</div>
						<p className="text-xs text-muted-foreground mt-1">注册用户总数</p>
					</CardContent>
				</Card>

				<Card className="hover:border-primary/40 transition-colors shadow-2xs">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">全站互动</CardTitle>
						<div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
							<MessageSquare className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black tracking-tight">
							{stats.overview.totalComments}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							读者发表的所有评论
						</p>
					</CardContent>
				</Card>

				<Card className="hover:border-primary/40 transition-colors shadow-2xs">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">文章总数</CardTitle>
						<div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
							<FileText className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black tracking-tight">
							{stats.overview.totalPosts}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							全站已收录文章篇数
						</p>
					</CardContent>
				</Card>

				<Card className="hover:border-primary/40 transition-colors shadow-2xs">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">标签分类</CardTitle>
						<div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
							<Palette className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black tracking-tight">
							{stats.overview.totalTags}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							关联标签与维度分类
						</p>
					</CardContent>
				</Card>
			</div>

			{/* 详细统计表格 & 移动端卡片式自适应 */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 热门文章 */}
				<Card className="shadow-2xs">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg flex items-center gap-2">
									<TrendingUp className="size-4 text-primary" />
									热门文章榜单
								</CardTitle>
								<CardDescription>按评论与讨论热度排序</CardDescription>
							</div>
							<Button asChild variant="ghost" size="sm" className="text-xs">
								<Link href="/dashboard/posts">查看全部</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{/* 桌面端 Table */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>文章标题</TableHead>
										<TableHead className="text-right">评论数</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stats.topCommentedPosts.map((post) => (
										<TableRow key={post.id} className="hover:bg-muted/30">
											<TableCell className="font-medium">
												<Link
													href={`/posts/${post.slug}`}
													target="_blank"
													className="hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
												>
													<span className="truncate max-w-sm">
														{post.title}
													</span>
													<Eye className="size-3 text-muted-foreground opacity-60" />
												</Link>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="secondary" className="font-mono">
													{post.commentCount}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* 移动端 Card List 触控自适应 */}
						<div className="space-y-3 md:hidden">
							{stats.topCommentedPosts.map((post) => (
								<div
									key={post.id}
									className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between gap-3 shadow-2xs"
								>
									<Link
										href={`/posts/${post.slug}`}
										target="_blank"
										className="font-medium text-sm hover:text-primary line-clamp-1 flex-1"
									>
										{post.title}
									</Link>
									<Badge variant="secondary" className="font-mono shrink-0">
										{post.commentCount} 条
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* 活跃用户 */}
				<Card className="shadow-2xs">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg flex items-center gap-2">
									<UserCog className="size-4 text-purple-500" />
									活跃读者榜单
								</CardTitle>
								<CardDescription>发表互动评论最多的读者</CardDescription>
							</div>
							<Button asChild variant="ghost" size="sm" className="text-xs">
								<Link href="/dashboard/users">用户管理</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{/* 桌面端 Table */}
						<div className="hidden md:block">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>用户名 / 邮箱</TableHead>
										<TableHead className="text-right">评论贡献</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stats.topCommentingUsers.map((user) => (
										<TableRow key={user.id} className="hover:bg-muted/30">
											<TableCell>
												<div>
													<div className="font-medium text-foreground">
														{user.name}
													</div>
													<div className="text-xs text-muted-foreground">
														{user.email}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="secondary" className="font-mono">
													{user.commentCount}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* 移动端 Card List */}
						<div className="space-y-3 md:hidden">
							{stats.topCommentingUsers.map((user) => (
								<div
									key={user.id}
									className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between gap-3 shadow-2xs"
								>
									<div className="min-w-0">
										<div className="font-medium text-sm truncate">
											{user.name}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{user.email}
										</div>
									</div>
									<Badge variant="secondary" className="font-mono shrink-0">
										{user.commentCount} 条
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 最新评论流 */}
			<Card className="shadow-2xs">
				<CardHeader className="pb-4">
					<CardTitle className="text-lg flex items-center gap-2">
						<MessageSquare className="size-4 text-blue-500" />
						最新评论与互动动态
					</CardTitle>
					<CardDescription>全站最近收到的读者反馈</CardDescription>
				</CardHeader>
				<CardContent>
					{/* 桌面端 Table */}
					<div className="hidden md:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>评论内容</TableHead>
									<TableHead>读者</TableHead>
									<TableHead>关联文章</TableHead>
									<TableHead className="text-right">时间</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{stats.recentComments.map((comment) => (
									<TableRow key={comment.id} className="hover:bg-muted/30">
										<TableCell className="max-w-md">
											<span className="line-clamp-2 text-sm">
												{comment.content}
											</span>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-xs font-normal">
												{comment.authorName}
											</Badge>
										</TableCell>
										<TableCell>
											<Link
												href={`/posts/${comment.postSlug}`}
												target="_blank"
												className="hover:underline text-primary text-xs font-medium line-clamp-1 max-w-50"
											>
												{comment.postTitle}
											</Link>
										</TableCell>
										<TableCell className="text-right text-xs text-muted-foreground font-mono">
											{new Date(comment.createdAt).toLocaleDateString('zh-CN')}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* 移动端 Card List */}
					<div className="space-y-3 md:hidden">
						{stats.recentComments.map((comment) => (
							<div
								key={comment.id}
								className="p-4 rounded-xl border bg-card/60 space-y-2 shadow-2xs"
							>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<Badge variant="outline" className="text-[11px]">
										{comment.authorName}
									</Badge>
									<span className="font-mono">
										{new Date(comment.createdAt).toLocaleDateString('zh-CN')}
									</span>
								</div>
								<p className="text-sm font-medium leading-relaxed">
									{comment.content}
								</p>
								<div className="pt-1 text-xs">
									<Link
										href={`/posts/${comment.postSlug}`}
										target="_blank"
										className="text-primary hover:underline line-clamp-1"
									>
										关联文章: 《{comment.postTitle}》
									</Link>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
