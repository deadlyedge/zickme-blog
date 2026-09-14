'use client'

import { ChevronDown, Info } from 'lucide-react'
import { useState } from 'react'
import { GalleryImageComments } from '@/components/gallery/GalleryImageComments'
import { GalleryImageInfo } from '@/components/gallery/GalleryImageInfo'
import type { GalleryPublicImage } from '@/types/gallery'

export function GalleryBottomPanel({
	image,
	location,
	className = '',
}: {
	image: GalleryPublicImage
	location?: string
	className?: string
}) {
	const [expanded, setExpanded] = useState(false)

	return (
		<div
			className={`absolute inset-x-0 bottom-0 z-20 max-h-[50%] text-white shadow-2xl ${expanded ? 'gallery-info-scroll overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-md' : 'overflow-hidden bg-black/30'} ${className}`}
		>
			{expanded ? (
				<div className="p-4 sm:p-5">
					<div className="sticky top-0 z-10 h-0">
						<button
							type="button"
							onClick={() => setExpanded(false)}
							aria-expanded="true"
							aria-label="收起图片信息"
							className="absolute right-0 top-2 shrink-0 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-0 sm:top-2"
						>
							<ChevronDown className="size-4" aria-hidden="true" />
						</button>
					</div>
					<GalleryImageInfo image={image} location={location} compact />
					<GalleryImageComments imageId={image.id} />
				</div>
			) : (
				<div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
					<h2 className="min-w-0 truncate text-base font-semibold sm:text-lg">
						{image.title || 'Untitled'}
					</h2>
					<button
						type="button"
						onClick={() => setExpanded(true)}
						aria-expanded="false"
						aria-label="展开图片信息"
						className="flex shrink-0 items-center gap-2 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<Info className="size-4" aria-hidden="true" />
					</button>
				</div>
			)}
		</div>
	)
}
