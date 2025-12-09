import { fetchPosts } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'
import { Metadata } from 'next'
import { PostGridClient } from '@/components/PostGridClient'
import type { Tag } from '@/generated/prisma/client'

// 每5分钟重新验证一次
export const revalidate = 300

export const metadata: Metadata = buildMetadata({
	title: '博客文章',
	description: '浏览我的所有博客文章和教程',
})

export default async function BlogPage() {
	const posts = await fetchPosts('PROJECT')
	const allTags = posts.flatMap((post) => post.tags ?? []) as Tag[]
	const uniqueTags = Array.from(
		new Map(allTags.map((tag) => [tag.id, tag])).values(),
	) as Tag[]

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			<div className="mx-auto max-w-7xl p-6">
				<h1 className="text-4xl font-bold mb-8">博客文章</h1>

				<PostGridClient posts={posts} tags={uniqueTags} />
			</div>
		</div>
	)
}
