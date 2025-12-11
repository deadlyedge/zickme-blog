import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/lib/actions/dashboard'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
} from '@/components/ui/button-group'
import { EditProfile } from '@/components/dashboard/EditProfile'
import Link from 'next/link'
import {
	Users,
	MessageSquare,
	FileText,
	TrendingUp,
	UserCog,
} from 'lucide-react'

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user.id || session.user.role !== 'ADMIN') redirect('/')

	const stats = await getDashboardStats()

	return (
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-8">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">仪表板</h1>
					<ButtonGroup>
						<Button asChild variant="outline" size="sm">
							<Link href="/dashboard/users">
								<UserCog className="h-4 w-4 mr-2" />
								用户管理
							</Link>
						</Button>

						<EditProfile />
						<ButtonGroupSeparator />
						<ButtonGroupText>管理员</ButtonGroupText>
					</ButtonGroup>
				</div>

				{/* 统计卡片 */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">总用户数</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalUsers}</div>
							<p className="text-xs text-muted-foreground">注册用户总数</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">总评论数</CardTitle>
							<MessageSquare className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalComments}</div>
							<p className="text-xs text-muted-foreground">所有评论总数</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">总文章数</CardTitle>
							<FileText className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalPosts}</div>
							<p className="text-xs text-muted-foreground">
								已发布: {stats.publishedPosts} | 草稿: {stats.draftPosts}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">活跃度</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{stats.totalPosts > 0
									? Math.round((stats.totalComments / stats.totalPosts) * 10) /
										10
									: 0}
							</div>
							<p className="text-xs text-muted-foreground">
								平均每篇文章评论数
							</p>
						</CardContent>
					</Card>
				</div>

				{/* 详细统计表格 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* 评论数前5的文章 */}
					<Card>
						<CardHeader>
							<CardTitle>热门文章</CardTitle>
							<CardDescription>评论数最多的文章</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>文章标题</TableHead>
										<TableHead className="text-right">评论数</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stats.topCommentedPosts.map((post) => (
										<TableRow key={post.id}>
											<TableCell>
												<Link
													href={`/blog/${post.slug}`}
													className="hover:underline text-blue-600">
													{post.title}
												</Link>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="secondary">{post.commentCount}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* 发表最多评论的前五用户 */}
					<Card>
						<CardHeader>
							<CardTitle>活跃用户</CardTitle>
							<CardDescription>发表评论最多的用户</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>用户名</TableHead>
										<TableHead className="text-right">评论数</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stats.topCommentingUsers.map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div>
													<div className="font-medium">{user.name}</div>
													<div className="text-sm text-muted-foreground">
														{user.email}
													</div>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant="secondary">{user.commentCount}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>

				{/* 最新评论 */}
				<Card>
					<CardHeader>
						<CardTitle>最新评论</CardTitle>
						<CardDescription>最近发布的评论</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>评论内容</TableHead>
									<TableHead>作者</TableHead>
									<TableHead>文章</TableHead>
									<TableHead>时间</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{stats.recentComments.map((comment) => (
									<TableRow key={comment.id}>
										<TableCell className="max-w-xs truncate">
											{comment.content}
										</TableCell>
										<TableCell>
											<Badge variant="outline">{comment.authorName}</Badge>
										</TableCell>
										<TableCell>
											<Link
												href={`/blog/${comment.postSlug}`}
												className="hover:underline text-blue-600">
												{comment.postTitle}
											</Link>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{new Date(comment.createdAt).toLocaleDateString('zh-CN')}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
