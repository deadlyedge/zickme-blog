import Image from 'next/image'
import Link from 'next/link'
import type { GalleryPublic } from '@/types/gallery'

export function GalleryCard({ gallery }: { gallery: GalleryPublic }) {
	const image = gallery.images[0]
	return (
		<Link
			className="group block overflow-hidden rounded-sm bg-[#2f2f2f] text-white"
			href={`/gallery/${gallery.slug}`}
		>
			<div className="relative aspect-[4/3] overflow-hidden">
				{image ? (
					<Image
						src={gallery.cover || image.url}
						alt={image.alt}
						fill
						sizes="(min-width: 1024px) 33vw, 100vw"
						className="object-cover transition-opacity group-hover:opacity-80"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-sm text-white/45">
						暂无图片
					</div>
				)}
			</div>
			<div className="space-y-2 p-4">
				<h2 className="text-lg font-semibold">{gallery.title}</h2>
				<p className="line-clamp-2 text-sm leading-6 text-white/55">
					{gallery.description || '查看这个相册中的图片'}
				</p>
				<p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
					{gallery.images.length} 张图片
				</p>
			</div>
		</Link>
	)
}
