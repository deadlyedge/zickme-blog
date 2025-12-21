import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostClient } from '@/components/PostClient'
import { fetchAllPostSlugs, fetchPostBySlug } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

export default async function PostPage({ params }: PageProps) {
	const { slug } = await params
	const post = await fetchPostBySlug(slug)

	if (!post) {
		notFound()
	}

	return <PostClient initialPost={post} />
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const post = await fetchPostBySlug(slug)

	if (!post) {
		return buildMetadata({
			title: '文章未找到',
		})
	}

	return buildMetadata({
		title: post.title,
		description: post.excerpt || `阅读 ${post.title}`,
		image: post.poster || undefined,
	})
}

export async function generateStaticParams() {
	// 在开发模式下，为了避免缓存问题，暂时不预生成静态页面
	// 等生产环境时再启用
	if (process.env.NODE_ENV === 'development') {
		return []
	}

	const slugs = await fetchAllPostSlugs('BLOG')
	return slugs.map((slug) => ({
		slug,
	}))
}
