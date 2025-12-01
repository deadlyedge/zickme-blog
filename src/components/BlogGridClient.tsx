'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BlogPostViewModel, TagViewModel } from '@/lib/content-providers'
import { cn, formatPublishedDate } from '@/lib/utils'
import { ButtonGroup } from './ui/button-group'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

type Props = {
	posts: BlogPostViewModel[]
	tags: TagViewModel[]
}

export default function BlogGridClient({ posts, tags }: Props) {
	const [activeTag, setActiveTag] = useState<string>('All')

	const filteredPosts = useMemo(() => {
		if (activeTag === 'All') return posts
		return posts.filter((post) =>
			post.tags?.some((tag) => tag.slug === activeTag)
		)
	}, [posts, activeTag])

	return (
		<div>
			<div className="mb-8">
				<h2 className="text-lg font-semibold mb-4">按标签过滤</h2>
				<ButtonGroup>
					<Button
						size="sm"
						onClick={() => setActiveTag('All')}
						className={cn(
							activeTag === 'All'
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary hover:bg-secondary/80'
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
									: 'bg-secondary hover:bg-secondary/80'
							)}
							style={{
								backgroundColor:
									activeTag === tag.slug ? undefined : tag.color || undefined,
								color:
									activeTag === tag.slug
										? undefined
										: tag.color
											? '#fff'
											: undefined,
							}}>
							{tag.name}
						</Button>
					))}
				</ButtonGroup>
			</div>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{filteredPosts.map((post) => (
					<Link href={`/blog/${post.slug}`} key={post.id}>
						<article className="bg-card rounded-lg overflow-hidden shadow">
							{post.featuredImageUrl && (
								<Image
									src={post.featuredImageUrl}
									alt={post.title}
									width={400}
									height={200}
									className="w-full h-48 object-cover"
								/>
							)}
							<div className="p-6">
								<h2 className="text-xl font-semibold mb-2">{post.title}</h2>
								<p className="text-muted-foreground mb-4">{post.excerpt}</p>
								<div className="flex flex-wrap gap-1 mb-2">
									{post.tags?.map((tag) => (
										<Badge
											key={tag.slug}
											className="bg-secondary"
											style={{
												backgroundColor: tag.color || undefined,
												color: tag.color ? '#fff' : undefined,
											}}>
											{tag.name}
										</Badge>
									))}
								</div>
								<time className="text-sm text-muted-foreground">
									{formatPublishedDate(post.publishedAt || post.createdAt)}
								</time>
							</div>
						</article>{' '}
					</Link>
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
