'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
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
		getSingleBlogPost,
		preloading,
		isSingleContentCached,
		setSingleBlogPost,
		setPreloadingBlog,
	} = useAppStore()

	const post = getSingleBlogPost(slug)
	const isLoading = preloading.blogPost === slug

	// 总是尝试加载数据（包括页面刷新时）
	useEffect(() => {
		async function loadPost() {
			// 如果正在预加载，等待完成
			if (preloading.blogPost === slug) {
				return
			}

			// 如果数据已缓存，直接使用
			if (isSingleContentCached('blog', slug)) {
				return
			}

			// 开始加载数据
			setPreloadingBlog(slug)
			try {
				const response = await fetch(`/api/blog/${slug}`)
				if (!response.ok) {
					if (response.status === 404) {
						// 文章不存在，不要调用notFound()，让页面显示404状态
						return
					}
					throw new Error('Failed to load post')
				}

				const postData = await response.json()
				setSingleBlogPost(slug, postData)
			} catch (error) {
				console.error('Failed to load blog post:', error)
			} finally {
				setPreloadingBlog(null)
			}
		}

		if (slug) {
			loadPost()
		}
	}, [
		slug,
		preloading.blogPost,
		isSingleContentCached,
		setPreloadingBlog,
		setSingleBlogPost,
	])

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

	if (!post && !isLoading) {
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

	// 如果还在加载或没有数据，不渲染内容
	if (isLoading || !post) {
		return null
	}

	return (
		<div className="pt-16 overflow-y-auto h-svh">
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
		</div>
	)
}
