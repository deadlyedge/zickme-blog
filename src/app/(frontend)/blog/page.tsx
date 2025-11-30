import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { safeExtract } from '@/lib/utils'

export default async function BlogPage() {
	const payloadConfig = await config
	const payload = await getPayload({ config: payloadConfig })

	const posts = await payload.find({
		collection: 'posts',
		where: {
			status: {
				equals: 'published',
			},
		},
		sort: '-publishedAt',
	})

	return (
		<div className="container mx-auto px-4 py-16">
			<h1 className="text-4xl font-bold mb-8">博客文章</h1>

			<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				{posts.docs.map((post) => (
					<article
						key={post.id}
						className="bg-card rounded-lg overflow-hidden shadow">
						{post.featuredImage && (
							<Image
								src={safeExtract(post.featuredImage)?.url || ''}
								alt={post.title}
								width={400}
								height={200}
								className="w-full h-48 object-cover"
							/>
						)}
						<div className="p-6">
							<h2 className="text-xl font-semibold mb-2">
								<Link href={`/blog/${post.slug}`} className="hover:underline">
									{post.title}
								</Link>
							</h2>
							<p className="text-muted-foreground mb-4">{post.excerpt}</p>
							<div className="flex flex-wrap gap-2 mb-4">
								{post.tags?.map((tag) => {
									const t = safeExtract(tag)
									if (!t) return null
									return (
										<span key={t.id} className="bg-secondary px-3 py-1 rounded">
											{t.name}
										</span>
									)
								})}
							</div>
							<time className="text-sm text-muted-foreground">
								{new Date(
									post.publishedAt || post.createdAt
								).toLocaleDateString()}
							</time>
						</div>
					</article>
				))}
			</div>
		</div>
	)
}
