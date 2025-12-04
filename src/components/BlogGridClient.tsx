'use client'

import { useMemo, useState } from 'react'
import type { BlogPostViewModel, TagViewModel } from '@/lib/content-providers'
import { cn } from '@/lib/utils'
import { ButtonGroup } from './ui/button-group'
import { Button } from './ui/button'
import { BlogPostCard } from './BlogPostCard'

type Props = {
	posts: BlogPostViewModel[]
	tags: TagViewModel[]
}

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export default function BlogGridClient({ posts, tags }: Props) {
	const [activeTag, setActiveTag] = useState<string>('All')
	const setBlogPosts = useAppStore((state) => state.setBlogPosts)
	const setTags = useAppStore((state) => state.setTags)
	// const storePostsMap = useAppStore((state) => state.blogPosts)

	// 初始数据同步 (Hydration)
	// 如果 Store 中没有数据，或者 Server Component 传来的数据更新，我们就更新 Store。
	// 但为了简单和避免无限循环，我们只在 mount 时同步一次，将首屏数据灌入 store。
	useEffect(() => {
		setBlogPosts(posts)
		setTags(tags)
	}, [posts, tags, setBlogPosts, setTags])

	// 优先使用 store 中的数据（如果有更新），但对于列表页 SSR 还是主要源。
	// 这里我们为了实现 "Client Cache 优先" 的体验（例如从详情页回来时保持状态），
	// 可以考虑：如果 storePostsMap 有值，是否应该用它？
	// 但问题是 posts 是从 Server 传来的最新数据。
	// 所以正确的策略是：Server 数据 -> Store。UI 总是显示 Store 里的数据（如果我们要完全做客户端渲染），
	// 或者保持现状，UI 显示 props.posts，Store 只是为了被动缓存给其他页面使用。

	// 鉴于用户希望应用 Zustand 缓存，最好的方式是：
	// UI 仍然基于 Server Data (props.posts) 渲染，因为它是最新的。
	// Store 这里仅仅作为一个"Cache Writer"，把最新的数据缓存起来，供 NavigationLink 预加载和其他组件使用。
	// 所以这里不需要改变 filteredPosts 的源。

	const filteredPosts = useMemo(() => {
		if (activeTag === 'All') return posts
		return posts.filter((post) =>
			post.tags?.some((tag) => tag.slug === activeTag),
		)
	}, [posts, activeTag])

	return (
		<div>
			<p className="text-muted">按标签过滤</p>
			<ButtonGroup className="mb-4 flex-wrap space-y-2">
				<Button
					size="sm"
					onClick={() => setActiveTag('All')}
					className={cn(
						activeTag === 'All'
							? 'bg-primary text-primary-foreground'
							: 'bg-secondary hover:bg-secondary/80',
					)}>
					全部文章
				</Button>
				{tags.map((tag) => (
					<Button
						size="sm"
						key={tag.slug}
						onClick={() => setActiveTag(tag.slug)}
						className={cn(
							activeTag === tag.slug
								? 'bg-primary text-primary-foreground'
								: 'hover:bg-[white] hover:text-(--tag-color) bg-(--tag-color) text-white',
						)}
						style={
							{
								'--tag-color': tag.color,
							} as React.CSSProperties
						}>
						{tag.name}
					</Button>
				))}
			</ButtonGroup>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{filteredPosts.map((post) => (
					<BlogPostCard key={post.id} post={post} />
				))}
			</div>

			{filteredPosts.length === 0 && (
				<div className="text-center py-16">
					<p className="text-muted-foreground">
						{activeTag === 'All'
							? '暂无博客文章。'
							: `没有找到标签为 "${tags.find((t) => t.slug === activeTag)?.name}" 的文章。`}
					</p>
				</div>
			)}
		</div>
	)
}
