import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
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

export function RecentCommentsList({
	comments,
}: {
	comments: DashboardStats['recentComments']
}) {
	return (
		<Card className="shadow-2xs">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg flex items-center gap-2">
					<MessageSquare className="size-4 text-blue-500" />
					最新评论与互动动态
				</CardTitle>
				<CardDescription>全站最近收到的读者反馈</CardDescription>
			</CardHeader>
			<CardContent>
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
							{comments.map((comment) => (
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
				<div className="space-y-3 md:hidden">
					{comments.map((comment) => (
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
	)
}
