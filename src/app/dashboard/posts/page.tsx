'use client'

import { format } from 'date-fns'
import {
	AlertTriangle,
	Archive,
	CheckSquare,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	ImageIcon,
	Loader2,
	Pencil,
	RefreshCw,
	RotateCcw,
	Search,
	Square,
	Trash2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import {
	archivePost,
	batchUpdatePostStatus,
	deletePostPermanently,
	getDashboardPosts,
	getDashboardTags,
	restorePost,
	updatePostPosterAction,
	updatePostStatus,
	uploadPostPosterAction,
} from '@/lib/actions/posts-admin'
import type { PostWithTags, StatusType, Tag } from '@/types'

const STATUS_BADGE_MAP: Record<
	StatusType,
	{
		label: string
		variant: 'default' | 'secondary' | 'outline' | 'destructive'
	}
> = {
	PUBLISHED: { label: '已发布', variant: 'default' },
	DRAFT: { label: '草稿', variant: 'secondary' },
	ARCHIVED: { label: '已归档', variant: 'outline' },
	PENDING: { label: '待审核', variant: 'outline' },
	SPAM: { label: '垃圾内容', variant: 'destructive' },
}

export default function DashboardPostsPage() {
	const [posts, setPosts] = useState<PostWithTags[]>([])
	const [tagsList, setTagsList] = useState<Tag[]>([])
	const [loading, setLoading] = useState(true)
	const [isPending, startTransition] = useTransition()

	// 筛选参数
	const [statusFilter, setStatusFilter] = useState<string>('ALL')
	const [tagFilter, setTagFilter] = useState<string>('ALL')
	const [searchQuery, setSearchQuery] = useState('')
	const [includeArchived, _setIncludeArchived] = useState(false)

	// 批量选择
	const [selectedIds, setSelectedIds] = useState<string[]>([])

	// 预览文章弹窗
	const [previewPost, setPreviewPost] = useState<PostWithTags | null>(null)

	// 删除确认弹窗
	const [deleteTargetPost, setDeleteTargetPost] = useState<PostWithTags | null>(
		null,
	)
	const [posterTargetPost, setPosterTargetPost] = useState<PostWithTags | null>(
		null,
	)
	const [posterUrl, setPosterUrl] = useState('')
	const [posterFile, setPosterFile] = useState<File | null>(null)

	const loadData = useCallback(async () => {
		try {
			setLoading(true)
			const [postsData, tagsData] = await Promise.all([
				getDashboardPosts({
					status:
						statusFilter === 'ALL' ? undefined : (statusFilter as StatusType),
					tagSlug: tagFilter === 'ALL' ? undefined : tagFilter,
					search: searchQuery || undefined,
					includeArchived: includeArchived || statusFilter === 'ARCHIVED',
				}),
				getDashboardTags(),
			])
			setPosts(postsData)
			setTagsList(tagsData as Tag[])
			setSelectedIds([])
		} catch (err) {
			console.error(err)
			toast.error('加载文章列表失败')
		} finally {
			setLoading(false)
		}
	}, [statusFilter, tagFilter, searchQuery, includeArchived])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		loadData()
	}

	const handleStatusChange = async (postId: string, newStatus: StatusType) => {
		startTransition(async () => {
			const res = await updatePostStatus(postId, newStatus)
			if (res.success) {
				toast.success('文章状态已更新')
				setPosts((prev) =>
					prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)),
				)
			} else {
				toast.error(res.error || '状态更新失败')
			}
		})
	}

	const handleArchive = async (postId: string) => {
		startTransition(async () => {
			const res = await archivePost(postId)
			if (res.success) {
				toast.success('文章已归档')
				loadData()
			} else {
				toast.error(res.error || '归档失败')
			}
		})
	}

	const handleRestore = async (postId: string) => {
		startTransition(async () => {
			const res = await restorePost(postId)
			if (res.success) {
				toast.success('文章已恢复发布状态')
				loadData()
			} else {
				toast.error(res.error || '恢复失败')
			}
		})
	}

	const handleDeletePermanently = async () => {
		if (!deleteTargetPost) return
		startTransition(async () => {
			const res = await deletePostPermanently(deleteTargetPost.id)
			if (res.success) {
				toast.success(`文章 [${deleteTargetPost.title}] 已永久删除`)
				setDeleteTargetPost(null)
				loadData()
			} else {
				toast.error(res.error || '删除失败')
			}
		})
	}

	const openPosterEditor = (post: PostWithTags) => {
		setPosterTargetPost(post)
		setPosterUrl(post.poster || '')
		setPosterFile(null)
	}

	const handlePosterSave = async () => {
		if (!posterTargetPost) return
		startTransition(async () => {
			const result = posterFile
				? await (() => {
						const formData = new FormData()
						formData.append('file', posterFile)
						return uploadPostPosterAction(posterTargetPost.id, formData)
					})()
				: await updatePostPosterAction(
						posterTargetPost.id,
						posterUrl.trim() || null,
					)
			if (result.success) {
				toast.success('文章封面已更新')
				setPosts((prev) =>
					prev.map((post) =>
						post.id === posterTargetPost.id
							? { ...post, poster: result.poster ?? null }
							: post,
					),
				)
				setPosterTargetPost(null)
			} else {
				toast.error(result.error || '封面更新失败')
			}
		})
	}

	const handlePosterRemove = async () => {
		if (!posterTargetPost) return
		startTransition(async () => {
			const result = await updatePostPosterAction(posterTargetPost.id, null)
			if (result.success) {
				toast.success('文章封面已移除')
				setPosts((prev) =>
					prev.map((post) =>
						post.id === posterTargetPost.id ? { ...post, poster: null } : post,
					),
				)
				setPosterTargetPost(null)
			} else {
				toast.error(result.error || '移除封面失败')
			}
		})
	}

	const toggleSelectAll = () => {
		if (selectedIds.length === posts.length) {
			setSelectedIds([])
		} else {
			setSelectedIds(posts.map((p) => p.id))
		}
	}

	const toggleSelectOne = (id: string) => {
		if (selectedIds.includes(id)) {
			setSelectedIds((prev) => prev.filter((item) => item !== id))
		} else {
			setSelectedIds((prev) => [...prev, id])
		}
	}

	const handleBatchStatus = async (status: StatusType) => {
		if (selectedIds.length === 0) return
		startTransition(async () => {
			const res = await batchUpdatePostStatus(selectedIds, status)
			if (res.success) {
				toast.success(`已批量将 ${selectedIds.length} 篇文章转为 ${status}`)
				loadData()
			} else {
				toast.error(res.error || '批量操作失败')
			}
		})
	}

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-7xl">
			{/* 顶栏 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<FileText className="h-6 w-6 text-primary" />
						文章管理看板
					</h1>
					<p className="text-sm text-muted-foreground">
						集中掌控全站文章状态、快速切换发布/草稿/归档
					</p>
				</div>

				<div className="flex items-center gap-2 self-start sm:self-auto">
					<Button
						variant="outline"
						size="sm"
						onClick={() => loadData()}
						disabled={loading}
						className="shadow-2xs"
					>
						<RefreshCw
							className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`}
						/>
						刷新数据
					</Button>
				</div>
			</div>

			{/* 筛选与检索控制条 */}
			<Card className="shadow-2xs">
				<CardContent className="p-4">
					<div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
						{/* 搜索框 */}
						<form
							onSubmit={handleSearchSubmit}
							className="flex items-center gap-2 flex-1 max-w-md"
						>
							<div className="relative flex-1">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="搜索文章标题、简介或 Slug..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-8"
								/>
							</div>
							<Button type="submit" size="sm">
								搜索
							</Button>
						</form>

						{/* 状态与标签筛选器 */}
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<div className="flex items-center gap-1.5">
								<Filter className="h-4 w-4 text-muted-foreground" />
								<span className="text-xs text-muted-foreground">状态:</span>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-28 h-8 text-xs">
										<SelectValue placeholder="全选状态" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">全部状态</SelectItem>
										<SelectItem value="PUBLISHED">已发布</SelectItem>
										<SelectItem value="DRAFT">草稿</SelectItem>
										<SelectItem value="ARCHIVED">已归档</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center gap-1.5">
								<span className="text-xs text-muted-foreground">标签:</span>
								<Select value={tagFilter} onValueChange={setTagFilter}>
									<SelectTrigger className="w-32 h-8 text-xs">
										<SelectValue placeholder="全部标签" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">全部标签</SelectItem>
										{tagsList.map((tag) => (
											<SelectItem key={tag.slug} value={tag.slug}>
												{tag.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 批量操作控制浮条 */}
			{selectedIds.length > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl shadow-xs">
					<div className="text-sm font-medium flex items-center gap-2">
						<CheckSquare className="h-4 w-4 text-primary" />
						已选中 <Badge variant="default">{selectedIds.length}</Badge> 篇文章
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => handleBatchStatus('PUBLISHED')}
							disabled={isPending}
							className="h-8 text-xs bg-background"
						>
							批量设为已发布
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => handleBatchStatus('DRAFT')}
							disabled={isPending}
							className="h-8 text-xs bg-background"
						>
							批量设为草稿
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => handleBatchStatus('ARCHIVED')}
							disabled={isPending}
							className="h-8 text-xs bg-background text-amber-600 hover:text-amber-700"
						>
							批量归档
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => setSelectedIds([])}
							className="h-8 text-xs"
						>
							取消选择
						</Button>
					</div>
				</div>
			)}

			{/* 文章数据展示区：桌面端 Table + 移动端 Card List */}
			<Card className="shadow-2xs">
				<CardHeader className="p-4 border-b">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base flex items-center gap-2">
							文章列表 ({posts.length})
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={toggleSelectAll}
							className="text-xs gap-1.5 h-8 md:hidden"
						>
							{selectedIds.length === posts.length && posts.length > 0 ? (
								<CheckSquare className="h-4 w-4 text-primary" />
							) : (
								<Square className="h-4 w-4 text-muted-foreground" />
							)}
							全选 / 取消
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{loading ? (
						<div className="flex items-center justify-center p-12 text-muted-foreground">
							<Loader2 className="h-6 w-6 animate-spin mr-2" />
							正在加载文章列表...
						</div>
					) : posts.length === 0 ? (
						<div className="text-center p-12 text-muted-foreground space-y-3">
							<p className="text-sm">未找到符合筛选条件的文章</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setStatusFilter('ALL')
									setTagFilter('ALL')
									setSearchQuery('')
								}}
							>
								重置所有筛选
							</Button>
						</div>
					) : (
						<>
							{/* 桌面端 Table 视图 */}
							<div className="hidden md:block">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12 text-center">
												<button
													type="button"
													onClick={toggleSelectAll}
													className="inline-flex items-center justify-center"
												>
													{selectedIds.length === posts.length &&
													posts.length > 0 ? (
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
												STATUS_BADGE_MAP[post.status] ||
												STATUS_BADGE_MAP.PUBLISHED
											const isSelected = selectedIds.includes(post.id)

											return (
												<TableRow
													key={post.id}
													className={isSelected ? 'bg-primary/5' : undefined}
												>
													<TableCell className="text-center">
														<button
															type="button"
															onClick={() => toggleSelectOne(post.id)}
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
																post.tags.slice(0, 2).map((t) => (
																	<Badge
																		key={t.slug}
																		variant="outline"
																		className="text-[10px] px-1 py-0"
																	>
																		{t.name}
																	</Badge>
																))
															) : (
																<span className="text-xs text-muted-foreground">
																	-
																</span>
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
															{/* 快速预览 */}
															<Button
																variant="ghost"
																size="sm"
																title="快速预览"
																onClick={() => setPreviewPost(post)}
															>
																<Eye className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																title="编辑封面"
																onClick={() => openPosterEditor(post)}
															>
																<ImageIcon className="h-4 w-4" />
															</Button>

															{/* 查看详情页 */}
															<Button
																asChild
																variant="ghost"
																size="sm"
																title="在新标签页查看"
															>
																<Link
																	href={`/posts/${post.slug}`}
																	target="_blank"
																>
																	<ExternalLink className="h-4 w-4" />
																</Link>
															</Button>

															{/* 状态切换下拉 */}
															<Select
																value={post.status}
																onValueChange={(val) =>
																	handleStatusChange(post.id, val as StatusType)
																}
																disabled={isPending}
															>
																<SelectTrigger className="w-22.5 h-8 text-xs">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="PUBLISHED">
																		已发布
																	</SelectItem>
																	<SelectItem value="DRAFT">草稿</SelectItem>
																	<SelectItem value="ARCHIVED">归档</SelectItem>
																</SelectContent>
															</Select>

															{/* 归档 / 恢复 */}
															{post.archivedAt || post.status === 'ARCHIVED' ? (
																<Button
																	variant="ghost"
																	size="sm"
																	title="恢复发布"
																	onClick={() => handleRestore(post.id)}
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
																	onClick={() => handleArchive(post.id)}
																	disabled={isPending}
																	className="text-amber-600 hover:text-amber-700"
																>
																	<Archive className="h-4 w-4" />
																</Button>
															)}

															{/* 物理删除 */}
															<Button
																variant="ghost"
																size="sm"
																title="永久删除"
																onClick={() => setDeleteTargetPost(post)}
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

							{/* 移动端 Card List 视图 */}
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
													onClick={() => toggleSelectOne(post.id)}
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

											{/* 标签与日期 */}
											<div className="flex items-center justify-between text-xs text-muted-foreground pl-7">
												<div className="flex flex-wrap gap-1">
													{post.tags?.slice(0, 3).map((t) => (
														<Badge
															key={t.slug}
															variant="outline"
															className="text-[10px] px-1 py-0"
														>
															{t.name}
														</Badge>
													))}
												</div>
												<span className="font-mono text-[11px]">
													{post.publishedAt
														? format(new Date(post.publishedAt), 'yyyy-MM-dd')
														: '-'}
												</span>
											</div>

											{/* 移动端操作按钮流 */}
											<div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 pl-7">
												<div className="flex items-center gap-1">
													<Button
														variant="outline"
														size="sm"
														className="h-8 text-xs"
														onClick={() => setPreviewPost(post)}
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
														onValueChange={(val) =>
															handleStatusChange(post.id, val as StatusType)
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
														onClick={() => setDeleteTargetPost(post)}
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
						</>
					)}
				</CardContent>
			</Card>

			{/* 预览弹窗 */}
			<Dialog
				open={Boolean(previewPost)}
				onOpenChange={(open) => !open && setPreviewPost(null)}
			>
				<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl">{previewPost?.title}</DialogTitle>
						<DialogDescription asChild className="space-y-1">
							<div>
								<div>Slug: /{previewPost?.slug}</div>
								{previewPost?.excerpt && <div>摘要: {previewPost.excerpt}</div>}
							</div>
						</DialogDescription>
					</DialogHeader>
					{previewPost?.poster && (
						<div className="relative aspect-video rounded-md overflow-hidden bg-muted border my-2">
							<Image
								src={previewPost.poster}
								alt={previewPost.title}
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
					)}

					<div className="mt-4 p-4 bg-muted/40 rounded border font-mono text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
						{previewPost?.content || '(无 Markdown 正文内容)'}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPreviewPost(null)}>
							关闭
						</Button>
						<Button asChild>
							<Link href={`/posts/${previewPost?.slug}`} target="_blank">
								<ExternalLink className="h-4 w-4 mr-2" />
								前往文章详情页
							</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 永久删除警告确认弹窗 */}
			<Dialog
				open={Boolean(posterTargetPost)}
				onOpenChange={(open) => !open && setPosterTargetPost(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Pencil className="h-4 w-4 text-primary" />
							调整文章封面
						</DialogTitle>
						<DialogDescription>
							{posterTargetPost?.title} · 推荐使用 16:9 图片
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{(posterFile || posterUrl) && (
							<div className="relative aspect-video overflow-hidden rounded-md border bg-muted">
								{posterFile ? (
									<Image
										src={URL.createObjectURL(posterFile)}
										alt="封面预览"
										fill
										unoptimized
										className="object-cover"
									/>
								) : (
									<Image
										src={posterUrl}
										alt="封面预览"
										fill
										unoptimized
										className="object-cover"
									/>
								)}
							</div>
						)}
						<Input
							value={posterUrl}
							onChange={(event) => {
								setPosterUrl(event.target.value)
								setPosterFile(null)
							}}
							placeholder="https://res.cloudinary.com/..."
							disabled={Boolean(posterFile)}
						/>
						<div className="flex items-center gap-2">
							<Input
								type="file"
								accept="image/*"
								onChange={(event) => {
									setPosterFile(event.target.files?.[0] || null)
									setPosterUrl('')
								}}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							上传图片会自动经过 Cloudinary WebP 压缩；留空并保存可移除封面。
						</p>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPosterTargetPost(null)}>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={handlePosterRemove}
							disabled={isPending}
						>
							移除封面
						</Button>
						<Button onClick={handlePosterSave} disabled={isPending}>
							{isPending ? '保存中...' : '保存封面'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 永久删除警告确认弹窗 */}
			<Dialog
				open={Boolean(deleteTargetPost)}
				onOpenChange={(open) => !open && setDeleteTargetPost(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-destructive flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							确认永久删除文章？
						</DialogTitle>
						<DialogDescription>
							您即将彻底删除文章{' '}
							<span className="font-semibold text-foreground">
								[{deleteTargetPost?.title}]
							</span>{' '}
							(/{deleteTargetPost?.slug})。
							此操作将直接清理数据库关联记录且不可撤销！
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteTargetPost(null)}>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeletePermanently}
							disabled={isPending}
						>
							{isPending ? '删除中...' : '确认彻底删除'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
