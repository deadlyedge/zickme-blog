'use client'

import { ArrowRight, Newspaper } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import { PostCard } from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import type { PostWithTags } from '@/types'

interface LatestPostsSectionProps {
	posts: PostWithTags[]
}

export const LatestPostsSection: React.FC<LatestPostsSectionProps> = ({
	posts,
}) => {
	if (!posts || posts.length === 0) return null

	return (
		<section
			id="posts"
			aria-labelledby="latest-posts-title"
			className="pt-10 pb-16 px-2 sm:px-0"
		>
			<div className="flex items-center gap-2 mb-6">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider">
					<Newspaper className="size-3.5" />
					LATEST WRITING
				</div>
				<div className="h-px flex-1 bg-border/60" />
			</div>

			<div className="flex items-baseline justify-between mb-8">
				<div>
					<h2
						id="latest-posts-title"
						className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
					>
						最新发布
					</h2>
					<p className="text-xs sm:text-sm text-muted-foreground mt-1">
						关于全栈开发、系统架构、AI Agent 与设计思考
					</p>
				</div>
				<Button variant="ghost" size="sm" asChild className="group/btn gap-1.5">
					<Link href="/posts">
						<span>查看全部</span>
						<ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
					</Link>
				</Button>
			</div>

			<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<PostCard key={`latest-${post.id}`} post={post} />
				))}
			</div>
		</section>
	)
}
