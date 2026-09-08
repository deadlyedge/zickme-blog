'use client'

import { Pin, Sparkles } from 'lucide-react'
import type React from 'react'
import { PostCard } from '@/components/PostCard'
import type { PostWithTags } from '@/types'

interface PinnedPostsSectionProps {
	posts: PostWithTags[]
}

export const PinnedPostsSection: React.FC<PinnedPostsSectionProps> = ({
	posts,
}) => {
	if (!posts || posts.length === 0) return null

	return (
		<section aria-labelledby="pinned-posts-title" className="mb-16 pt-6 pb-8">
			<div className="flex items-center gap-2 mb-6">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider">
					<Pin className="size-3.5 rotate-45" />
					PINNED & FEATURED
				</div>
				<div className="h-px flex-1 bg-border/60" />
			</div>

			<div className="flex items-baseline justify-between mb-8">
				<h2
					id="pinned-posts-title"
					className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2"
				>
					<span>置顶推荐</span>
					<Sparkles className="size-5 text-amber-500 fill-amber-500 hidden sm:inline" />
				</h2>
				<span className="text-xs sm:text-sm text-muted-foreground">
					精选置顶内容
				</span>
			</div>

			<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<div key={`pinned-${post.id}`} className="relative group">
						<div className="absolute top-3 right-3 z-20 pointer-events-none">
							<div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 dark:bg-card/90 backdrop-blur-xs text-foreground text-[11px] font-bold shadow-md border border-border/50">
								<Pin className="size-3 text-primary rotate-45" />
								<span>置顶</span>
							</div>
						</div>
						<PostCard post={post} />
					</div>
				))}
			</div>
		</section>
	)
}
