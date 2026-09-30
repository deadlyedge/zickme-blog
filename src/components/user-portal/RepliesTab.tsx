import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import type { UserReplyItem } from '@/types/user'

export function RepliesTab({ replies }: { replies: UserReplyItem[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">回复通知 (Reply Hub)</CardTitle>
				<CardDescription>其他读者或管理员对您的评论发表的回复</CardDescription>
			</CardHeader>
			<CardContent>
				{replies.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground text-sm">
						暂无收到的回复。
					</div>
				) : (
					<div className="space-y-4">
						{replies.map((reply) => (
							<div
								key={reply.id}
								className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-3"
							>
								<div className="flex items-center justify-between gap-2 text-xs">
									<div className="flex items-center gap-2">
										<Avatar className="size-6">
											<AvatarImage src={reply.replyAuthor.image || ''} />
											<AvatarFallback>
												{reply.replyAuthor.name.slice(0, 2)}
											</AvatarFallback>
										</Avatar>
										<span className="font-bold text-foreground">
											{reply.replyAuthor.name}
										</span>
										<span className="text-muted-foreground">回复了您</span>
									</div>
									<span className="text-muted-foreground">
										{new Date(reply.createdAt).toLocaleString('zh-CN')}
									</span>
								</div>
								<div className="text-xs text-muted-foreground bg-background p-2 rounded-lg border line-clamp-2">
									您的原始评论: "{reply.originalCommentContent}"
								</div>
								<p className="text-sm font-medium text-foreground">
									{reply.content}
								</p>
								<div className="flex justify-end pt-1">
									<Button size="sm" variant="outline" asChild>
										<Link
											href={`/posts/${reply.postSlug}#comments`}
											className="text-xs"
										>
											前往文章查看
										</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
