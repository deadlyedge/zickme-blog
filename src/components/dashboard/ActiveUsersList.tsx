import { UserCog } from 'lucide-react'
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

export function ActiveUsersList({
	users,
}: {
	users: DashboardStats['topCommentingUsers']
}) {
	return (
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
				<div className="hidden md:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>用户名 / 邮箱</TableHead>
								<TableHead className="text-right">评论贡献</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
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
				<div className="space-y-3 md:hidden">
					{users.map((user) => (
						<div
							key={user.id}
							className="p-3.5 rounded-xl border bg-card/60 flex items-center justify-between gap-3 shadow-2xs"
						>
							<div className="min-w-0">
								<div className="font-medium text-sm truncate">{user.name}</div>
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
	)
}
