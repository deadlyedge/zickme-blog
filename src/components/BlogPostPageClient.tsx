'use client'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import { useBlogPost } from '@/hooks/useBlogPost'
import { RichText } from '@/components/RichText'
import { formatPublishedDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CommentsSectionClient } from '@/components/comments'

interface PageProps {
	slug: string
}

export function BlogPostPageClient({ slug }: PageProps) {
	const { data: post, isLoading, error } = useBlogPost(slug)

	if (isLoading) {
		return (
			<div className="mx-auto p-6 pt-24 max-w-4xl flex items-center justify-center">
				<div>Loading...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="mx-auto p-6 pt-24 max-w-4xl flex items-center justify-center">
				<div>Error loading blog post</div>
			</div>
		)
	}

	if (!post) {
		notFound()
	}

	return (
		<div className="mx-auto p-6 pt-24 max-w-4xl">
			<article>
				<header className="mb-8">
					<h1 className="text-4xl font-bold mb-4">{post.title}</h1>

					{post.featuredImageUrl && (
						<Image
							src={post.featuredImageUrl}
							alt={post.title}
							width={800}
							height={400}
							className="rounded-lg mb-6"
						/>
					)}

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

					<time className="text-muted-foreground">
						发布于 {formatPublishedDate(post.publishedAt || post.createdAt)}
					</time>
				</header>

				<div className="prose prose-lg max-w-none">
					<RichText value={post.content} />
				</div>
			</article>

			<CommentsSectionClient docId={post.id} docType="posts" />
		</div>
	)
}
