'use client'

import { format } from 'date-fns'
import { CheckSquare, ExternalLink, Eye, Square, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { STATUS_BADGE_MAP } from '@/components/dashboard/posts/constants'
import type { PostListProps } from '@/components/dashboard/posts/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { StatusType } from '@/types/content/post'

type PostsMobileListProps = Pick<
	PostListProps,
	| 'posts'
	| 'selectedIds'
	| 'isPending'
	| 'onToggleSelect'
	| 'onPreview'
	| 'onStatusChange'
	| 'onDelete'
>

export function PostsMobileList({
	posts,
	selectedIds,
	isPending,
	onToggleSelect,
	onPreview,
	onStatusChange,
	onDelete,
}: PostsMobileListProps) {
	return (
		<div className="divide-y md:hidden">
			{posts.map((post) => {
				const statusConfig =
					STATUS_BADGE_MAP[post.status] || STATUS_BADGE_MAP.PUBLISHED
				const isSelected = selectedIds.includes(post.id)

				return (
					<div
						key={post.id}
						className={`p-4 space-y-3 ${isSelected ? 'bg-primary/5' : ''}`}
					>
						<div className="flex items-start gap-3">
							<button
								type="button"
								onClick={() => onToggleSelect(post.id)}
								className="mt-1"
							>
								{isSelected ? (
									<CheckSquare className="h-4 w-4 text-primary" />
								) : (
									<Square className="h-4 w-4 text-muted-foreground" />
								)}
							</button>

							<div className="relative w-14 h-10 rounded overflow-hidden bg-muted border shrink-0">
								{post.poster ? (
									<Image
										src={post.poster}
										alt={post.title}
										fill
										className="object-cover"
										unoptimized
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
										无图
									</div>
								)}
							</div>

							<div className="flex-1 min-w-0">
								<h4 className="font-semibold text-sm line-clamp-1">
									{post.title}
								</h4>
								<p className="text-xs text-muted-foreground line-clamp-1">
									/{post.slug}
								</p>
							</div>

							<Badge
								variant={statusConfig.variant}
								className="shrink-0 text-[10px]"
							>
								{statusConfig.label}
							</Badge>
						</div>

						<div className="flex items-center justify-between text-xs text-muted-foreground pl-7">
							<div className="flex flex-wrap gap-1">
								{post.tags?.slice(0, 3).map((tag) => (
									<Badge
										key={tag.slug}
										variant="outline"
										className="text-[10px] px-1 py-0"
									>
										{tag.name}
									</Badge>
								))}
							</div>
							<span className="font-mono text-[11px]">
								{post.publishedAt
									? format(new Date(post.publishedAt), 'yyyy-MM-dd')
									: '-'}
							</span>
						</div>

						<div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 pl-7">
							<div className="flex items-center gap-1">
								<Button
									variant="outline"
									size="sm"
									className="h-8 text-xs"
									onClick={() => onPreview(post)}
								>
									<Eye className="h-3.5 w-3.5 mr-1" />
									预览
								</Button>
								<Button
									asChild
									variant="outline"
									size="sm"
									className="h-8 text-xs"
								>
									<Link href={`/posts/${post.slug}`} target="_blank">
										<ExternalLink className="h-3.5 w-3.5 mr-1" />
										查看
									</Link>
								</Button>
							</div>

							<div className="flex items-center gap-1">
								<Select
									value={post.status}
									onValueChange={(value) =>
										onStatusChange(post.id, value as StatusType)
									}
									disabled={isPending}
								>
									<SelectTrigger className="w-20 h-8 text-xs">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PUBLISHED">发布</SelectItem>
										<SelectItem value="DRAFT">草稿</SelectItem>
										<SelectItem value="ARCHIVED">归档</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => onDelete(post)}
									className="text-destructive hover:bg-destructive/10"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
