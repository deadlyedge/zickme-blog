import { Eye, TrendingUp } from 'lucide-react'
import Link from 'next/link'
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
import type { DashboardStats } from '@/lib/dashboard/stats-types'

export function PopularPostsList({
	posts,
}: {
	posts: DashboardStats['topCommentedPosts']
}) {
	return (
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
				<div className="hidden md:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>文章标题</TableHead>
								<TableHead className="text-right">评论数</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{posts.map((post) => (
								<TableRow key={post.id} className="hover:bg-muted/30">
									<TableCell className="font-medium">
										<Link
											href={`/posts/${post.slug}`}
											target="_blank"
											className="hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
										>
											<span className="truncate max-w-sm">{post.title}</span>
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
				<div className="space-y-3 md:hidden">
					{posts.map((post) => (
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
	)
}
