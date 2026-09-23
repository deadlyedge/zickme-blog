'use client'

import { CheckSquare, FileText, Loader2, RefreshCw, Square } from 'lucide-react'
import {
	type SubmitEvent,
	useCallback,
	useEffect,
	useState,
	useTransition,
} from 'react'
import { toast } from 'sonner'
import { PostDeleteDialog } from '@/components/dashboard/posts/PostDeleteDialog'
import { PostPosterDialog } from '@/components/dashboard/posts/PostPosterDialog'
import { PostPreviewDialog } from '@/components/dashboard/posts/PostPreviewDialog'
import { PostsBulkActions } from '@/components/dashboard/posts/PostsBulkActions'
import { PostsFilters } from '@/components/dashboard/posts/PostsFilters'
import { PostsMobileList } from '@/components/dashboard/posts/PostsMobileList'
import { PostsTable } from '@/components/dashboard/posts/PostsTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { PostWithTags, StatusType } from '@/types/content/post'
import type { Tag } from '@/types/content/tag'

export default function DashboardPostsClient() {
	const [posts, setPosts] = useState<PostWithTags[]>([])
	const [tagsList, setTagsList] = useState<Tag[]>([])
	const [loading, setLoading] = useState(true)
	const [isPending, startTransition] = useTransition()
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [tagFilter, setTagFilter] = useState('ALL')
	const [searchQuery, setSearchQuery] = useState('')
	const [includeArchived] = useState(false)
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [previewPost, setPreviewPost] = useState<PostWithTags | null>(null)
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
		} catch (error) {
			console.error(error)
			toast.error('加载文章列表失败')
		} finally {
			setLoading(false)
		}
	}, [statusFilter, tagFilter, searchQuery, includeArchived])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleSearchSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault()
		loadData()
	}

	const handleStatusChange = async (postId: string, newStatus: StatusType) => {
		startTransition(async () => {
			const result = await updatePostStatus(postId, newStatus)
			if (result.success) {
				toast.success('文章状态已更新')
				setPosts((previous) =>
					previous.map((post) =>
						post.id === postId ? { ...post, status: newStatus } : post,
					),
				)
			} else {
				toast.error(result.error || '状态更新失败')
			}
		})
	}

	const handleArchive = async (postId: string) => {
		startTransition(async () => {
			const result = await archivePost(postId)
			if (result.success) {
				toast.success('文章已归档')
				loadData()
			} else {
				toast.error(result.error || '归档失败')
			}
		})
	}

	const handleRestore = async (postId: string) => {
		startTransition(async () => {
			const result = await restorePost(postId)
			if (result.success) {
				toast.success('文章已恢复发布状态')
				loadData()
			} else {
				toast.error(result.error || '恢复失败')
			}
		})
	}

	const handleDeletePermanently = async () => {
		if (!deleteTargetPost) return
		startTransition(async () => {
			const result = await deletePostPermanently(deleteTargetPost.id)
			if (result.success) {
				toast.success(`文章 [${deleteTargetPost.title}] 已永久删除`)
				setDeleteTargetPost(null)
				loadData()
			} else {
				toast.error(result.error || '删除失败')
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
				setPosts((previous) =>
					previous.map((post) =>
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
				setPosts((previous) =>
					previous.map((post) =>
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
			setSelectedIds(posts.map((post) => post.id))
		}
	}

	const toggleSelectOne = (postId: string) => {
		if (selectedIds.includes(postId)) {
			setSelectedIds((previous) => previous.filter((id) => id !== postId))
		} else {
			setSelectedIds((previous) => [...previous, postId])
		}
	}

	const handleBatchStatus = async (status: StatusType) => {
		if (selectedIds.length === 0) return
		startTransition(async () => {
			const result = await batchUpdatePostStatus(selectedIds, status)
			if (result.success) {
				toast.success(`已批量将 ${selectedIds.length} 篇文章转为 ${status}`)
				loadData()
			} else {
				toast.error(result.error || '批量操作失败')
			}
		})
	}

	const resetFilters = () => {
		setStatusFilter('ALL')
		setTagFilter('ALL')
		setSearchQuery('')
	}

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-7xl">
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

			<PostsFilters
				searchQuery={searchQuery}
				statusFilter={statusFilter}
				tagFilter={tagFilter}
				tags={tagsList}
				onSearchChange={setSearchQuery}
				onSearchSubmit={handleSearchSubmit}
				onStatusChange={setStatusFilter}
				onTagChange={setTagFilter}
			/>

			<PostsBulkActions
				selectedCount={selectedIds.length}
				isPending={isPending}
				onStatusChange={handleBatchStatus}
				onClearSelection={() => setSelectedIds([])}
			/>

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
							<Button variant="outline" size="sm" onClick={resetFilters}>
								重置所有筛选
							</Button>
						</div>
					) : (
						<>
							<PostsTable
								posts={posts}
								selectedIds={selectedIds}
								isPending={isPending}
								onToggleSelect={toggleSelectOne}
								onToggleSelectAll={toggleSelectAll}
								onPreview={setPreviewPost}
								onEditPoster={openPosterEditor}
								onStatusChange={handleStatusChange}
								onArchive={handleArchive}
								onRestore={handleRestore}
								onDelete={setDeleteTargetPost}
							/>
							<PostsMobileList
								posts={posts}
								selectedIds={selectedIds}
								isPending={isPending}
								onToggleSelect={toggleSelectOne}
								onPreview={setPreviewPost}
								onStatusChange={handleStatusChange}
								onDelete={setDeleteTargetPost}
							/>
						</>
					)}
				</CardContent>
			</Card>

			<PostPreviewDialog
				post={previewPost}
				onClose={() => setPreviewPost(null)}
			/>
			<PostPosterDialog
				post={posterTargetPost}
				posterUrl={posterUrl}
				posterFile={posterFile}
				isPending={isPending}
				onPosterUrlChange={(value) => {
					setPosterUrl(value)
					setPosterFile(null)
				}}
				onPosterFileChange={(file) => {
					setPosterFile(file)
					setPosterUrl('')
				}}
				onClose={() => setPosterTargetPost(null)}
				onRemove={handlePosterRemove}
				onSave={handlePosterSave}
			/>
			<PostDeleteDialog
				post={deleteTargetPost}
				isPending={isPending}
				onClose={() => setDeleteTargetPost(null)}
				onConfirm={handleDeletePermanently}
			/>
		</div>
	)
}
