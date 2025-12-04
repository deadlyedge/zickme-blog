import BlogPostClient from './BlogPostClient'
import {
	fetchBlogPostBySlug,
	fetchAllBlogPostSlugs,
} from '@/lib/content-providers'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

export default async function BlogPostPage({ params }: PageProps) {
	const { slug } = await params
	const post = await fetchBlogPostBySlug(slug)

	if (!post) {
		notFound()
	}

	return <BlogPostClient initialPost={post} />
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const post = await fetchBlogPostBySlug(slug)

	if (!post) {
		return {
			title: '文章未找到',
		}
	}

	return {
		title: post.title,
		description: post.excerpt || `阅读 ${post.title}`,
		openGraph: {
			title: post.title,
			description: post.excerpt || `阅读 ${post.title}`,
			images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
		},
	}
}

export async function generateStaticParams() {
	// 在开发模式下，为了避免缓存问题，暂时不预生成静态页面
	// 等生产环境时再启用
	if (process.env.NODE_ENV === 'development') {
		return []
	}

	const slugs = await fetchAllBlogPostSlugs()
	return slugs.map((slug) => ({
		slug,
	}))
}
