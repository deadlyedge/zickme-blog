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

export default function BlogGridClient({ posts, tags }: Props) {
	const [activeTag, setActiveTag] = useState<string>('All')

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
