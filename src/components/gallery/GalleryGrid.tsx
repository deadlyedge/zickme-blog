'use client'

import Image from 'next/image'
import { useState } from 'react'
import { GalleryBottomPanel } from '@/components/gallery/GalleryBottomPanel'
import { GalleryImagePreloads } from '@/components/gallery/GalleryImagePreloads'
import { getGalleryImageUrl } from '@/lib/gallery/gallery-public'
import { cn } from '@/lib/utils'
import type { GalleryPublicImage } from '@/types/gallery'

function GalleryImage({
	image,
	sizes,
	preload = false,
	variant = 'full',
}: {
	image: GalleryPublicImage
	sizes: string
	preload?: boolean
	variant?: 'full' | 'thumbnail'
}) {
	const [failed, setFailed] = useState(false)
	if (failed)
		return (
			<div className="flex h-full min-h-24 items-center justify-center bg-[#2f2f2f] px-4 text-center text-xs text-white/45">
				图片暂时无法加载
			</div>
		)
	return (
		<Image
			src={getGalleryImageUrl(image, variant)}
			alt={image.alt}
			fill
			preload={preload}
			{...(!preload ? { loading: 'lazy' as const } : {})}
			sizes={sizes}
			className="object-contain"
			onError={() => setFailed(true)}
		/>
	)
}

export function GalleryGrid({
	images,
	selectedIndex,
	onSelect,
	onOpen,
	location,
}: {
	images: GalleryPublicImage[]
	selectedIndex: number
	onSelect: (index: number) => void
	onOpen: (index: number) => void
	location?: string
}) {
	return (
		<>
			<GalleryImagePreloads
				images={images}
				selectedIndex={selectedIndex}
				sizes="(min-width: 768px) 75vw, 100vw"
			/>
			<section className="hidden min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(6rem,13vw,10rem)] gap-5 md:grid">
				<div className="group/stage relative min-h-0 overflow-hidden rounded-sm bg-[#2f2f2f]">
					<GalleryImage
						image={images[selectedIndex]}
						preload
						sizes="(min-width: 768px) 75vw, 100vw"
					/>
					<GalleryBottomPanel
						key={images[selectedIndex].id}
						image={images[selectedIndex]}
						location={location}
					/>
				</div>
				<div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
					{images.map((image, index) => (
						<button
							key={image.id}
							type="button"
							onClick={() => onSelect(index)}
							className={cn(
								'relative max-h-40 shrink-0 overflow-hidden rounded-sm text-left',
								index !== selectedIndex && 'opacity-55 hover:opacity-100',
							)}
							aria-label={`选择 ${image.title || `第 ${index + 1} 张图片`}`}
							aria-current={index === selectedIndex}
							style={{
								aspectRatio: `${image.width || 1} / ${image.height || 1}`,
							}}
						>
							<GalleryImage image={image} sizes="160px" variant="thumbnail" />
							<span className="absolute bottom-2 left-2 text-[10px] text-white/80">
								{String(index + 1).padStart(2, '0')}
							</span>
						</button>
					))}
				</div>
			</section>
			<section className="grid min-h-0 flex-1 grid-cols-2 items-start gap-3 overflow-x-hidden overflow-y-auto md:hidden">
				{[0, 1].map((column) => (
					<div key={column} className="min-w-0 space-y-3">
						{images.map((image, index) =>
							index % 2 === column ? (
								<button
									key={image.id}
									type="button"
									onClick={() => onOpen(index)}
									className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
								>
									<div
										className="relative overflow-hidden rounded-sm bg-[#2f2f2f]"
										style={{
											aspectRatio: `${image.width || 1} / ${image.height || 1}`,
										}}
									>
										<GalleryImage
											image={image}
											sizes="(max-width: 767px) 50vw, 160px"
											variant="thumbnail"
										/>
									</div>
									<div className="px-1 pb-1 pt-2">
										<p className="text-sm font-medium">
											{image.title || 'Untitled'}
										</p>
										<p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
											{String(index + 1).padStart(2, '0')}
										</p>
									</div>
								</button>
							) : null,
						)}
					</div>
				))}
			</section>
		</>
	)
}
