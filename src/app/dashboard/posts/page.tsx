'use client'

import { format } from 'date-fns'
import {
	AlertTriangle,
	Archive,
	ArrowLeft,
	CheckSquare,
	ExternalLink,
	Eye,
	FileText,
	Filter,
	Loader2,
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
	updatePostStatus,
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
	const [includeArchived, setIncludeArchived] = useState(false)

	// 批量选择
	const [selectedIds, setSelectedIds] = useState<string[]>([])

	// 预览文章弹窗
	const [previewPost, setPreviewPost] = useState<PostWithTags | null>(null)

	// 删除确认弹窗
	const [deleteTargetPost, setDeleteTargetPost] = useState<PostWithTags | null>(
		null,
	)

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
				toast.error(res.error || '更新失败')
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
				toast.success('文章已恢复发布')
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
				toast.success('文章已彻底删除')
				setDeleteTargetPost(null)
				setPosts((prev) => prev.filter((p) => p.id !== deleteTargetPost.id))
			} else {
				toast.error(res.error || '删除失败')
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
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-6">
				{/* 顶栏 */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link href="/dashboard">
							<Button variant="outline" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								返回概览
							</Button>
						</Link>
						<div>
							<h1 className="text-2xl font-bold flex items-center gap-2">
								<FileText className="h-6 w-6 text-primary" />
								文章管理看板
							</h1>
							<p className="text-sm text-muted-foreground">
								集中掌控全站文章状态、快速切换发布/草稿/归档
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={loadData}
							disabled={loading || isPending}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
							/>
							刷新列表
						</Button>
						<Link href="/dashboard/sync">
							<Button size="sm">
								<RefreshCw className="h-4 w-4 mr-2" />
								同步与导入中心
							</Button>
						</Link>
					</div>
				</div>

				{/* 筛选与操作卡片 */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base font-medium flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							筛选与批量操作
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap items-center gap-4">
							{/* 搜索框 */}
							<form
								onSubmit={handleSearchSubmit}
								className="flex items-center gap-2 flex-1 min-w-50"
							>
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="搜索标题或 slug..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-9"
									/>
								</div>
								<Button type="submit" variant="secondary" size="sm">
									搜索
								</Button>
							</form>

							{/* 状态筛选 */}
							<div className="flex items-center gap-2 min-w-37.5">
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-35">
										<SelectValue placeholder="文章状态" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">全部状态</SelectItem>
										<SelectItem value="PUBLISHED">
											已发布 (PUBLISHED)
										</SelectItem>
										<SelectItem value="DRAFT">草稿 (DRAFT)</SelectItem>
										<SelectItem value="ARCHIVED">已归档 (ARCHIVED)</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* 标签筛选 */}
							<div className="flex items-center gap-2 min-w-37.5">
								<Select value={tagFilter} onValueChange={setTagFilter}>
									<SelectTrigger className="w-35">
										<SelectValue placeholder="按标签" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">全部标签</SelectItem>
										{tagsList.map((tag) => (
											<SelectItem key={tag.id} value={tag.slug}>
												{tag.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* 包含归档选项 */}
							<Button
								variant={includeArchived ? 'default' : 'outline'}
								size="sm"
								onClick={() => setIncludeArchived(!includeArchived)}
							>
								{includeArchived ? '已包含已归档' : '包含已归档'}
							</Button>
						</div>

						{/* 批量操作控制栏 */}
						{selectedIds.length > 0 && (
							<div className="flex items-center justify-between p-3 bg-muted/60 rounded-md text-sm border">
								<span className="font-medium text-foreground">
									已勾选{' '}
									<span className="text-primary">{selectedIds.length}</span>{' '}
									篇文章
								</span>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleBatchStatus('PUBLISHED')}
										disabled={isPending}
									>
										转为已发布
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleBatchStatus('DRAFT')}
										disabled={isPending}
									>
										转为草稿
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => handleBatchStatus('ARCHIVED')}
										disabled={isPending}
									>
										转为归档
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* 文章数据表格 */}
				<Card>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-12 text-center">
										<button
											type="button"
											onClick={toggleSelectAll}
											className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
										>
											{selectedIds.length > 0 &&
											selectedIds.length === posts.length ? (
												<CheckSquare className="h-4 w-4 text-primary" />
											) : (
												<Square className="h-4 w-4" />
											)}
										</button>
									</TableHead>
									<TableHead className="min-w-60">文章标题 / Slug</TableHead>
									<TableHead>状态</TableHead>
									<TableHead>标签</TableHead>
									<TableHead>发布/更新时间</TableHead>
									<TableHead className="text-right">操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center py-12">
											<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
											<p className="text-sm text-muted-foreground mt-2">
												正在加载文章数据...
											</p>
										</TableCell>
									</TableRow>
								) : posts.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="text-center py-12 text-muted-foreground"
										>
											没有找到符合条件的文章
										</TableCell>
									</TableRow>
								) : (
									posts.map((post) => {
										const isSelected = selectedIds.includes(post.id)
										const statusBadge =
											STATUS_BADGE_MAP[post.status] ||
											STATUS_BADGE_MAP.PUBLISHED

										return (
											<TableRow
												key={post.id}
												className={
													post.archivedAt ? 'opacity-60 bg-muted/20' : ''
												}
											>
												<TableCell className="text-center">
													<button
														type="button"
														onClick={() => toggleSelectOne(post.id)}
														className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground"
													>
														{isSelected ? (
															<CheckSquare className="h-4 w-4 text-primary" />
														) : (
															<Square className="h-4 w-4" />
														)}
													</button>
												</TableCell>
												<TableCell>
													<div className="space-y-1">
														<div className="font-medium flex items-center gap-2">
															<span>{post.title}</span>
															{post.poster && (
																<Badge
																	variant="outline"
																	className="text-[10px] px-1 py-0"
																>
																	有封面
																</Badge>
															)}
														</div>
														<div className="text-xs text-muted-foreground font-mono">
															/{post.slug}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={statusBadge.variant}>
														{statusBadge.label}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1 max-w-50">
														{post.tags && post.tags.length > 0 ? (
															post.tags.map((tag) => (
																<Badge
																	key={tag.id}
																	variant="secondary"
																	className="text-xs px-1.5 py-0"
																>
																	{tag.name}
																</Badge>
															))
														) : (
															<span className="text-xs text-muted-foreground">
																无
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="text-xs space-y-0.5">
														<div className="text-foreground">
															发布:{' '}
															{post.publishedAt
																? format(
																		new Date(post.publishedAt),
																		'yyyy-MM-dd',
																	)
																: '未设'}
														</div>
														<div className="text-muted-foreground">
															更新:{' '}
															{post.updatedAt
																? format(
																		new Date(post.updatedAt),
																		'yyyy-MM-dd HH:mm',
																	)
																: '-'}
														</div>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex items-center justify-end gap-1">
														{/* 预览 */}
														<Button
															variant="ghost"
															size="sm"
															title="快速预览"
															onClick={() => setPreviewPost(post)}
														>
															<Eye className="h-4 w-4" />
														</Button>

														{/* 前台新窗口直达 */}
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
									})
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				{/* 预览弹窗 */}
				<Dialog
					open={Boolean(previewPost)}
					onOpenChange={(open) => !open && setPreviewPost(null)}
				>
					<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-xl">
								{previewPost?.title}
							</DialogTitle>
							<DialogDescription className="space-y-1">
								<div>Slug: /{previewPost?.slug}</div>
								{previewPost?.excerpt && <div>摘要: {previewPost.excerpt}</div>}
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
							<Button
								variant="outline"
								onClick={() => setDeleteTargetPost(null)}
							>
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
		</div>
	)
}
