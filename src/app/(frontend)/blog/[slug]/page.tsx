'use client'

import { notFound, useParams } from 'next/navigation'
import Image from 'next/image'
import { useEffect } from 'react'
import { RichText } from '@/components/RichText'
import { formatPublishedDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CommentsSection } from '@/components/comments'
import { useAppStore } from '@/lib/store'

export default function BlogPostPage() {
	const params = useParams()
	const slug = params.slug as string

	const {
		singleBlogPost: post,
		preloading,
		isCacheValid,
		setSingleBlogPost,
		setPreloadingBlog,
		loadingStates
	} = useAppStore()

	const isLoading = preloading.blogPost === slug || (loadingStates.pageTransition && !post)

	// 如果数据不在缓存中，加载它（作为fallback，以防预加载失败）
	useEffect(() => {
		async function loadPost() {
			if (!post && !preloading.blogPost && !isCacheValid('singleBlogPost')) {
				setPreloadingBlog(slug)
				try {
					const response = await fetch(`/api/blog/${slug}`)
					if (!response.ok) {
						if (response.status === 404) {
							notFound()
							return
						}
						throw new Error('Failed to load post')
					}

					const postData = await response.json()
					setSingleBlogPost(postData)
				} catch (error) {
					console.error('Failed to load blog post:', error)
				} finally {
					setPreloadingBlog(null)
				}
			}
		}

		// 只有在真正没有数据且没有预加载时才加载
		if (slug && !post && !preloading.blogPost && !isCacheValid('singleBlogPost')) {
			loadPost()
		}
	}, [slug, post, preloading.blogPost, isCacheValid, setPreloadingBlog, setSingleBlogPost])

	if (isLoading) {
		return (
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
		)
	}

	if (!post) {
		return notFound()
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

			<CommentsSection docId={post.id} docType="posts" />
		</div>
	)
}
