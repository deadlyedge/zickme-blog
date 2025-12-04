import { fetchBlogPosts, fetchTags } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'
import { Metadata } from 'next'
import BlogGridClient from '@/components/BlogGridClient'

// 每5分钟重新验证一次
export const revalidate = 600

export const metadata: Metadata = buildMetadata({
	title: '博客文章',
	description: '浏览我的所有博客文章和教程',
})

export default async function BlogPage() {
	const [posts, tags] = await Promise.all([fetchBlogPosts(), fetchTags()])

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			<div className="mx-auto max-w-7xl p-6">
				<h1 className="text-4xl font-bold mb-8">博客文章</h1>

				<BlogGridClient posts={posts} tags={tags} />
			</div>
		</div>
	)
}
