'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CardTilt, CardTiltContent } from '@/components/ui/effects/CardTilt'
import { getHomeGalleryCardOrientation } from '@/lib/gallery/home-presentation'
import type { HomeRecentGallery } from '@/types/content/home'

export function RecentGallerySection({
	galleries,
}: {
	galleries: HomeRecentGallery[]
}) {
	if (galleries.length === 0) return null
	return (
		<section
			aria-labelledby="recent-gallery-title"
			className="border-t border-border/60 px-2 py-12 sm:px-0"
		>
			<div className="mb-8 flex items-end justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						RECENT GALLERY
					</p>
					<h2
						id="recent-gallery-title"
						className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl"
					>
						最近相册
					</h2>
				</div>
				<Link
					href="/gallery"
					className="text-sm font-semibold text-muted-foreground hover:text-foreground"
				>
					查看全部 →
				</Link>
			</div>
			<div className="grid gap-5 sm:grid-cols-2">
				{galleries.map((gallery) => (
					<RecentGalleryCard key={gallery.slug} gallery={gallery} />
				))}
			</div>
		</section>
	)
}

function RecentGalleryCard({ gallery }: { gallery: HomeRecentGallery }) {
	const orientation = getHomeGalleryCardOrientation(
		gallery.width,
		gallery.height,
	)
	return (
		<CardTilt
			className="w-full"
			aria-labelledby={`recent-gallery-${gallery.slug}`}
		>
			<CardTiltContent className="w-full overflow-hidden rounded-2xl bg-card shadow-2xl">
				<Link
					href={gallery.href}
					className={`group relative block w-full overflow-hidden bg-muted text-white ${orientation === 'portrait' ? 'aspect-3/4' : 'aspect-4/3'}`}
				>
					<Image
						src={gallery.coverUrl}
						alt={gallery.coverTitle || gallery.title}
						fill
						sizes="(max-width: 640px) 90vw, 42vw"
						className="object-cover"
					/>
					<div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/30 to-transparent p-5 pt-16">
						<h3
							id={`recent-gallery-${gallery.slug}`}
							className="line-clamp-2 text-xl font-bold"
						>
							{gallery.title}
						</h3>
					</div>
				</Link>
			</CardTiltContent>
		</CardTilt>
	)
}
