'use client'

import { Info } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { GalleryImageInfo } from '@/components/gallery/GalleryImageInfo'
import { cn } from '@/lib/utils'
import type { GalleryPublicImage } from '@/types/gallery'

function GalleryImage({
	image,
	sizes,
	priority = false,
}: {
	image: GalleryPublicImage
	sizes: string
	priority?: boolean
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
			src={image.url}
			alt={image.alt}
			fill
			priority={priority}
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
			<section className="hidden min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(6rem,13vw,10rem)] gap-5 md:grid">
				<div className="group/stage relative min-h-0 overflow-hidden rounded-sm bg-[#2f2f2f]">
					<GalleryImage
						image={images[selectedIndex]}
						priority
						sizes="(min-width: 768px) 75vw, 100vw"
					/>
					<div className="group/info absolute inset-x-0 bottom-0 z-10 flex justify-end">
						<div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-black/55 p-5 text-white opacity-0 shadow-2xl backdrop-blur-md transition duration-300 motion-reduce:transition-none group-hover/info:pointer-events-auto group-hover/info:translate-y-0 group-hover/info:opacity-100 group-focus-within/info:pointer-events-auto group-focus-within/info:translate-y-0 group-focus-within/info:opacity-100">
							<GalleryImageInfo
								image={images[selectedIndex]}
								location={location}
								compact
							/>
						</div>
						<button
							type="button"
							aria-label="显示图片信息"
							className="relative z-10 m-4 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/85 backdrop-blur transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white hover:bg-black/70"
						>
							<Info className="size-4" />
						</button>
					</div>
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
							<GalleryImage image={image} sizes="160px" />
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
										<GalleryImage image={image} sizes="50vw" />
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
