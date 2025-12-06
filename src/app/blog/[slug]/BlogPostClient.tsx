'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { RichText } from '@/components/RichText'
import { formatPublishedDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CommentsSection } from '@/components/comments'
import { useAppStore } from '@/lib/store'
import type { BlogPostDetailViewModel } from '@/lib/content-providers'

interface BlogPostClientProps {
	initialPost?: BlogPostDetailViewModel
}

export default function BlogPostClient({ initialPost }: BlogPostClientProps) {
	const params = useParams()
	const slug = params.slug as string

	const getSingleBlogPost = useAppStore((state) => state.getSingleBlogPost)
	const fetchBlogPost = useAppStore((state) => state.fetchBlogPost)
	const setSingleBlogPost = useAppStore((state) => state.setSingleBlogPost)
	const preloadingBlogPost = useAppStore((state) => state.preloading.blogPost)

	// 使用 initialPost 作为主要数据源，如果 store 中有更新版本则使用
	const cachedPost = getSingleBlogPost(slug)
	const post = cachedPost || initialPost
	const isLoading = preloadingBlogPost === slug

	// 如果 store 中没有数据，用 initialPost 初始化
	useEffect(() => {
		if (initialPost && !getSingleBlogPost(slug)) {
			console.log(`BlogPostClient [${slug}]: setting initial data from server`)
			setSingleBlogPost(slug, initialPost)
		}
	}, [initialPost, slug, setSingleBlogPost, getSingleBlogPost])

	// 后台更新数据（用于获取最新内容）
	useEffect(() => {
		if (slug && !isLoading) {
			console.log(`BlogPostClient [${slug}]: triggering background fetch`)
			fetchBlogPost(slug)
		}
	}, [slug, fetchBlogPost, isLoading])

	if (isLoading && !post) {
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
