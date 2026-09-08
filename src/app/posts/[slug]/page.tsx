import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PostClient } from '@/components/PostClient'
import { fetchAllPostSlugs, fetchPostBySlug } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'

// 文章详情页 10 分钟重新验证（ISR）
export const revalidate = 600

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
	if (process.env.NODE_ENV === 'development') {
		return []
	}

	try {
		const slugs = await fetchAllPostSlugs()
		return slugs.map((slug) => ({
			slug,
		}))
	} catch (error) {
		console.warn('generateStaticParams for posts failed:', error)
		return []
	}
}
