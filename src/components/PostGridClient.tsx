'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { PostType } from '@/generated/prisma/client'
import { usePosts } from '@/lib/hooks/useContent'
import { cn } from '@/lib/utils'
import { PostCard } from './PostCard'
import { Button } from './ui/button'
import { ButtonGroup } from './ui/button-group'
import { Spinner } from './ui/spinner'

type PostTag = {
	id: string
	name: string
	slug: string
	color: string | null
}

type Props = {
	type?: PostType
}

export function PostGridClient({ type = 'BLOG' }: Props) {
	const searchParams = useSearchParams()
	const router = useRouter()
	const urlTag = searchParams.get('tag')

	// 从URL参数初始化activeTag
	const [activeTag, setActiveTag] = useState<string>(() => urlTag || 'All')

	// Use TanStack Query - data will be hydrated from server
	const { data: posts, isLoading, isError } = usePosts(type)

	// 处理标签点击，更新URL参数
	const handleTagClick = (tagSlug: string) => {
		setActiveTag(tagSlug)

		// 更新URL参数
		const currentPath = window.location.pathname
		if (tagSlug === 'All') {
			// 清除tag参数
			router.push(currentPath)
		} else {
			router.push(`${currentPath}?tag=${tagSlug}`)
		}
	}

	// Extract tags from posts data to avoid showing unused tags
	const tags = useMemo(() => {
		if (!posts) return []
		const tagMap = new Map<string, PostTag>()
		posts.forEach((post) => {
			post.tags?.forEach((tag: PostTag) => {
				if (!tagMap.has(tag.id)) {
					tagMap.set(tag.id, tag)
				}
			})
		})
		return Array.from(tagMap.values())
	}, [posts])

	const filteredPosts = useMemo(() => {
		if (!posts) return []
		if (activeTag === 'All') return posts
		return posts.filter((post) =>
			post.tags?.some((tag: PostTag) => tag.slug === activeTag),
		)
	}, [posts, activeTag])

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Spinner className="size-8" />
				<span className="ml-2 text-muted-foreground">正在加载文章列表...</span>
			</div>
		)
	}

	// Error state
	if (isError) {
		return (
			<div className="text-center py-16">
				<p className="text-muted-foreground">
					加载文章列表时出错，请稍后重试。
				</p>
			</div>
		)
	}

	return (
		<div>
			<p className="text-muted">按标签过滤</p>
			<ButtonGroup className="mb-4 flex-wrap space-y-2">
				<Button
					size="sm"
					onClick={() => handleTagClick('All')}
					className={cn(
						activeTag === 'All'
							? 'bg-primary text-primary-foreground'
							: 'bg-secondary hover:bg-secondary/80',
					)}
				>
					全部文章
				</Button>
				{tags?.map((tag) => (
					<Button
						size="sm"
						key={tag.slug}
						onClick={() => handleTagClick(tag.slug)}
						className={cn(
							activeTag === tag.slug
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-[white] hover:text-(--tag-color) bg-(--tag-color) text-white',
						)}
						style={
							{
								'--tag-color': tag.color || 'var(--secondary)',
							} as React.CSSProperties
						}
					>
						{tag.name}
					</Button>
				))}
			</ButtonGroup>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{filteredPosts.map((post) => (
					<PostCard key={post.id} post={post} />
				))}
			</div>

			{filteredPosts.length === 0 && (
				<div className="text-center py-16">
					<p className="text-muted-foreground">
						{activeTag === 'All'
							? '暂无博客文章。'
							: `没有找到标签为 "${tags?.find((t) => t.slug === activeTag)?.name}" 的文章。`}
					</p>
				</div>
			)}
		</div>
	)
}
