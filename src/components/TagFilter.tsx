'use client'

import Link from 'next/link'
import { TagViewModel } from '@/lib/content-providers'

interface TagFilterProps {
	tags: TagViewModel[]
	selectedTag?: string
}

export function TagFilter({ tags, selectedTag }: TagFilterProps) {
	return (
		<div className="mb-8">
			<h2 className="text-lg font-semibold mb-4">按标签过滤</h2>
			<div className="flex flex-wrap gap-2">
				<Link
					href="/blog"
					className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
						!selectedTag
							? 'bg-primary text-primary-foreground'
							: 'bg-secondary hover:bg-secondary/80'
					}`}
				>
					全部文章
				</Link>
				{tags.map((tag) => (
					<Link
						key={tag.slug}
						href={`/blog?tag=${tag.slug}`}
						className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
							selectedTag === tag.slug
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary hover:bg-secondary/80'
						}`}
						style={{
							backgroundColor: selectedTag === tag.slug ? undefined : tag.color || undefined,
							color: selectedTag === tag.slug ? undefined : tag.color ? '#fff' : undefined,
						}}
					>
						{tag.name}
					</Link>
				))}
			</div>
		</div>
	)
}
