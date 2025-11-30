import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { RichText } from '@/components/RichText'
import { safeExtract } from '@/lib/utils'

interface PageProps {
	params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: PageProps) {
	const { slug } = await params
	const payloadConfig = await config
	const payload = await getPayload({ config: payloadConfig })

	const posts = await payload.find({
		collection: 'posts',
		where: {
			slug: {
				equals: slug,
			},
			status: {
				equals: 'published',
			},
		},
		depth: 2,
	})

	if (!posts.docs.length) {
		notFound()
	}

	const post = posts.docs[0]

	return (
		<div className="container mx-auto px-4 py-16 max-w-4xl">
			<article>
				<header className="mb-8">
					<h1 className="text-4xl font-bold mb-4">{post.title}</h1>

					{post.featuredImage && (
						<Image
							src={safeExtract(post.featuredImage)?.url || ''}
							alt={post.title}
							width={800}
							height={400}
							className="rounded-lg mb-6"
						/>
					)}

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

					<time className="text-muted-foreground">
						发布于{' '}
						{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
					</time>
				</header>

				<div className="prose prose-lg max-w-none">
					<RichText value={post.content} />
				</div>
			</article>
		</div>
	)
}
