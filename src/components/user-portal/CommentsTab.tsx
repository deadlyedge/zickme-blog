import Link from 'next/link'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import type { UserCommentItem } from '@/types/user'

export function CommentsTab({ comments }: { comments: UserCommentItem[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">我的评论历史</CardTitle>
				<CardDescription>您在全站发表的所有文章评论与互动记录</CardDescription>
			</CardHeader>
			<CardContent>
				{comments.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground text-sm">
						您还没有发表过任何评论。去文章页面留下您的想法吧！
					</div>
				) : (
					<div className="space-y-4">
						{comments.map((comment) => (
							<div
								key={comment.id}
								className="p-4 rounded-xl border bg-muted/20 space-y-2 hover:border-primary/40 transition-colors"
							>
								<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
									<Link
										href={`/posts/${comment.postSlug}`}
										className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1"
									>
										《{comment.postTitle}》
									</Link>
									<span>
										{new Date(comment.createdAt).toLocaleString('zh-CN')}
									</span>
								</div>
								<p className="text-sm text-foreground/90 leading-relaxed">
									{comment.content}
								</p>
								{comment.parentAuthorName && (
									<div className="text-xs text-muted-foreground bg-background/60 p-2 rounded-lg border">
										回复了 @{comment.parentAuthorName} 的评论
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
