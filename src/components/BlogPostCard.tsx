import Image from 'next/image'

import { CardTilt, CardTiltContent } from './ui/effects/CardTilt'
import { Badge } from './ui/badge'
import { BlogPostViewModel } from '@/lib/content-providers'
import { formatPublishedDate } from '@/lib/utils'
import { Button } from './ui/button'
import { NavigationLink } from './NavigationLink'

type BlogPostCardProps = { post: BlogPostViewModel }

export const BlogPostCard = ({ post }: BlogPostCardProps) => {
	return (
		<CardTilt
			key={post.slug}
			aria-labelledby={`post-${post.title}`}
			tiltMaxAngle={15}
			scale={1.05}>
			<CardTiltContent className="rounded-2xl bg-card shadow-2xl overflow-hidden">
				<div className="relative bg-slate-100">
					<NavigationLink href={`/blog/${post.slug}`}>
						{post.featuredImageUrl ? (
							<div className="relative w-full aspect-4/3 bg-slate-100">
								<Image
									src={post.featuredImageUrl}
									alt={post.title}
									fill
									sizes="(max-width: 700px) 100vw, (max-width: 1024px) 50vw, 33vw"
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-80 flex items-center justify-center text-slate-400">
								No image
							</div>
						)}
					</NavigationLink>
					<div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
					<div className="absolute left-6 bottom-6 pointer-events-none">
						<span className="text-xl font-bold text-gray-50 drop-shadow-[0px_0px_13px_rgba(255,243,184,0.8)]">
							{post.title}
						</span>
						<div className="mt-2 flex flex-wrap gap-1">
							{post.tags?.slice(0, 3).map((t) => (
								<Badge
									key={t.slug}
									style={{
										backgroundColor: t.color || undefined,
										color: t.color ? '#fff' : undefined,
									}}>
									{t.name}
								</Badge>
							))}
						</div>
					</div>
				</div>

				<div className="p-6 bg-card">
					<p className="text-sm line-clamp-3">{post.excerpt}</p>

					<div className="mt-4 flex items-center justify-between text-xs text-slate-500">
						<div>
							{post.publishedAt && formatPublishedDate(post.publishedAt)}
						</div>
						<Button asChild>
							<NavigationLink href={`/blog/${post.slug}`}>访问</NavigationLink>
						</Button>
					</div>
				</div>
			</CardTiltContent>
		</CardTilt>
	)
}
