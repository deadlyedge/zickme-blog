'use client'

import { format } from 'date-fns'
import {
	Archive,
	CheckSquare,
	ExternalLink,
	Eye,
	ImageIcon,
	RotateCcw,
	Square,
	Trash2,
} from 'lucide-react'
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { StatusType } from '@/types/content/post'

type PostsTableProps = PostListProps & {
	onToggleSelectAll: () => void
}

export function PostsTable({
	posts,
	selectedIds,
	isPending,
	onToggleSelect,
	onToggleSelectAll,
	onPreview,
	onEditPoster,
	onStatusChange,
	onArchive,
	onRestore,
	onDelete,
}: PostsTableProps) {
	return (
		<div className="hidden md:block">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-12 text-center">
							<button
								type="button"
								onClick={onToggleSelectAll}
								className="inline-flex items-center justify-center"
							>
								{selectedIds.length === posts.length && posts.length > 0 ? (
									<CheckSquare className="h-4 w-4 text-primary" />
								) : (
									<Square className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
						</TableHead>
						<TableHead className="w-16">封面</TableHead>
						<TableHead>标题 / 摘要</TableHead>
						<TableHead className="w-28">状态</TableHead>
						<TableHead className="w-36">标签</TableHead>
						<TableHead className="w-28">发布时间</TableHead>
						<TableHead className="text-right w-44">操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{posts.map((post) => {
						const statusConfig =
							STATUS_BADGE_MAP[post.status] || STATUS_BADGE_MAP.PUBLISHED
						const isSelected = selectedIds.includes(post.id)

						return (
							<TableRow
								key={post.id}
								className={isSelected ? 'bg-primary/5' : undefined}
							>
								<TableCell className="text-center">
									<button
										type="button"
										onClick={() => onToggleSelect(post.id)}
										className="inline-flex items-center justify-center"
									>
										{isSelected ? (
											<CheckSquare className="h-4 w-4 text-primary" />
										) : (
											<Square className="h-4 w-4 text-muted-foreground" />
										)}
									</button>
								</TableCell>
								<TableCell>
									<div className="relative w-12 h-8 rounded overflow-hidden bg-muted border">
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
								</TableCell>
								<TableCell className="max-w-xs">
									<div className="font-semibold text-sm line-clamp-1">
										{post.title}
									</div>
									<div className="text-xs text-muted-foreground line-clamp-1">
										/{post.slug}
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={statusConfig.variant}>
										{statusConfig.label}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1 max-w-36">
										{post.tags && post.tags.length > 0 ? (
											post.tags.slice(0, 2).map((tag) => (
												<Badge
													key={tag.slug}
													variant="outline"
													className="text-[10px] px-1 py-0"
												>
													{tag.name}
												</Badge>
											))
										) : (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</div>
								</TableCell>
								<TableCell className="text-xs text-muted-foreground">
									{post.publishedAt
										? format(new Date(post.publishedAt), 'yyyy-MM-dd')
										: '-'}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="sm"
											title="快速预览"
											onClick={() => onPreview(post)}
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											title="编辑封面"
											onClick={() => onEditPoster(post)}
										>
											<ImageIcon className="h-4 w-4" />
										</Button>
										<Button
											asChild
											variant="ghost"
											size="sm"
											title="在新标签页查看"
										>
											<Link href={`/posts/${post.slug}`} target="_blank">
												<ExternalLink className="h-4 w-4" />
											</Link>
										</Button>
										<Select
											value={post.status}
											onValueChange={(value) =>
												onStatusChange(post.id, value as StatusType)
											}
											disabled={isPending}
										>
											<SelectTrigger className="w-22.5 h-8 text-xs">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PUBLISHED">已发布</SelectItem>
												<SelectItem value="DRAFT">草稿</SelectItem>
												<SelectItem value="ARCHIVED">归档</SelectItem>
											</SelectContent>
										</Select>
										{post.archivedAt || post.status === 'ARCHIVED' ? (
											<Button
												variant="ghost"
												size="sm"
												title="恢复发布"
												onClick={() => onRestore(post.id)}
												disabled={isPending}
												className="text-green-600 hover:text-green-700"
											>
												<RotateCcw className="h-4 w-4" />
											</Button>
										) : (
											<Button
												variant="ghost"
												size="sm"
												title="归档下架"
												onClick={() => onArchive(post.id)}
												disabled={isPending}
												className="text-amber-600 hover:text-amber-700"
											>
												<Archive className="h-4 w-4" />
											</Button>
										)}
										<Button
											variant="ghost"
											size="sm"
											title="永久删除"
											onClick={() => onDelete(post)}
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</div>
	)
}
