'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CommentsSection } from '@/components/comments'
import { Badge } from '@/components/ui/badge'
import { usePost } from '@/lib/hooks/useContent'
import { formatPublishedDate } from '@/lib/utils'
import type { PostWithTags } from '@/types'

interface PostClientProps {
	initialPost?: PostWithTags
}

export function PostClient({ initialPost }: PostClientProps) {
	const params = useParams()
	const slug = params.slug as string

	// Use TanStack Query with initial data hydration
	const { data: post, isLoading } = usePost(slug, {
		initialData: initialPost,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})

	if (isLoading) {
		return (
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto p-6 pt-24 max-w-4xl">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
						<div className="h-64 bg-gray-200 rounded mb-6"></div>
						<div className="flex gap-2 mb-4">
							<div className="h-6 bg-gray-200 rounded w-16"></div>
							<div className="h-6 bg-gray-200 rounded w-20"></div>
						</div>
						<div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
						<div className="space-y-4">
							<div className="h-4 bg-gray-200 rounded"></div>
							<div className="h-4 bg-gray-200 rounded w-5/6"></div>
							<div className="h-4 bg-gray-200 rounded w-4/6"></div>
							<div className="h-4 bg-gray-200 rounded w-3/6"></div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!post) {
		return (
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto p-6 pt-24 max-w-4xl text-center">
					<h1 className="text-3xl font-semibold text-red-600 mb-4">
						文章未找到
					</h1>
					<p className="text-slate-600 mb-6">这篇文章可能已被删除或移动。</p>
					<Link href="/blog" className="text-sm text-amber-600 hover:underline">
						返回博客列表
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			<div className="mx-auto p-6 max-w-4xl">
				<article>
					<header className="mb-8">
						<h1 className="text-4xl font-bold mb-4">{post.title}</h1>

						{post.poster && (
							<Image
								src={post.poster}
								alt={post.title}
								width={800}
								height={400}
								className="rounded-lg mb-6 object-cover h-auto"
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
									}}
								>
									{tag.name}
								</Badge>
							))}
						</div>

						<time className="text-muted-foreground">
							发布于{' '}
							{formatPublishedDate(
								(post.publishedAt || post.createdAt).toISOString(),
							)}
						</time>
					</header>

					<div className="prose prose-lg prose-blog max-w-none">
						{/* TODO: Convert content to proper format for RichText component */}
						<div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
					</div>
				</article>

				<CommentsSection docId={post.id} />
			</div>
		</div>
	)
}
