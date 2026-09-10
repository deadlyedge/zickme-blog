'use client'

import { Tag as TagIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { usePosts } from '@/lib/hooks/useContent'
import { PostCard } from './PostCard'
import { PostTagFilter, type TagItem } from './PostTagFilter'
import { Spinner } from './ui/spinner'

export function PostGridClient() {
	const searchParams = useSearchParams()
	const router = useRouter()

	// 直接从 URL 推导当前激活标签（随浏览器前进/后退自动同步）
	const urlTag = searchParams.get('tag')
	const activeTag = urlTag || null

	// Use TanStack Query - data will be hydrated from server
	const { data: posts, isLoading, isError } = usePosts()

	// 处理标签点击，仅更新URL参数（activeTag 由 URL 派生，自动保持同步）
	const handleTagClick = (tagSlug: string | null) => {
		const currentPath = window.location.pathname
		if (!tagSlug) {
			router.push(currentPath)
		} else {
			router.push(`${currentPath}?tag=${tagSlug}`)
		}
	}

	// Extract tags from posts data
	const tags = useMemo(() => {
		if (!posts) return []
		const tagMap = new Map<string, TagItem>()
		posts.forEach((post) => {
			post.tags?.forEach((tag: TagItem) => {
				if (!tagMap.has(tag.id)) {
					tagMap.set(tag.id, tag)
				}
			})
		})
		return Array.from(tagMap.values())
	}, [posts])

	const filteredPosts = useMemo(() => {
		if (!posts) return []
		if (!activeTag) return posts
		return posts.filter((post) =>
			post.tags?.some((tag: TagItem) => tag.slug === activeTag),
		)
	}, [posts, activeTag])

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Spinner className="size-8 text-primary" />
				<span className="ml-3 text-sm text-muted-foreground font-medium">
					正在加载精彩文章...
				</span>
			</div>
		)
	}

	// Error state
	if (isError) {
		return (
			<div className="text-center py-16 p-8 rounded-2xl border border-destructive/20 bg-destructive/5 max-w-lg mx-auto">
				<p className="text-sm font-medium text-destructive">
					加载文章列表时出错，请稍后刷新重试。
				</p>
			</div>
		)
	}

	const activeTagName =
		tags.find((t) => t.slug === activeTag)?.name || activeTag

	return (
		<div className="space-y-8">
			{/* 现代化时尚标签过滤器（方案 D：渐变导流滑动 + 全量检索 Popover） */}
			<PostTagFilter
				tags={tags}
				activeTag={activeTag}
				getTagPostCount={(slug) =>
					posts?.filter((p) => p.tags?.some((t) => t.slug === slug)).length || 0
				}
				onTagSelect={handleTagClick}
			/>

			{/* 文章网格瀑布流 */}
			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{filteredPosts.map((post) => (
					<PostCard key={post.id} post={post} />
				))}
			</div>

			{/* 空状态反馈 */}
			{filteredPosts.length === 0 && (
				<div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border/80 bg-muted/10">
					<div className="inline-flex items-center justify-center size-12 rounded-2xl bg-muted/60 mb-4 text-muted-foreground">
						<TagIcon className="size-6" />
					</div>
					<h3 className="text-base font-semibold mb-1">未找到匹配文章</h3>
					<p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
						{!activeTag
							? '当前博客库中暂无文章。'
							: `标签「${activeTagName}」下暂未收录已发布的文章。`}
					</p>
					<button
						type="button"
						onClick={() => handleTagClick(null)}
						className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
					>
						返回查看全部
					</button>
				</div>
			)}
		</div>
	)
}
