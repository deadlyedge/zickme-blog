'use client'

import { useEffect, useState } from 'react'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox'
import type { GalleryPublic } from '@/types/gallery'

export function GalleryPostView({ albums }: { albums: GalleryPublic[] }) {
	const [albumIndex, setAlbumIndex] = useState(0)
	const [imageIndex, setImageIndex] = useState(0)
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const album = albums[albumIndex]
	const images = album?.images ?? []
	const safeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0))
	useEffect(() => {
		document.body.classList.add('gallery-mode')
		return () => document.body.classList.remove('gallery-mode')
	}, [])
	if (!album || images.length === 0)
		return (
			<div className="flex h-svh items-center justify-center bg-[#242424] text-sm text-white/55">
				这个相册暂无可展示的图片。
			</div>
		)
	return (
		<div className="gallery-page h-svh overflow-hidden bg-[#242424] text-[#f5f5f5]">
			<div className="mx-auto flex h-full max-w-7xl flex-col px-4 pb-4 pt-20 sm:px-6 lg:px-8">
				<nav
					className="mb-3 flex shrink-0 gap-5 overflow-x-auto whitespace-nowrap border-b border-white/10 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
					aria-label="选择相册"
				>
					{albums.map((item, index) => (
						<button
							key={item.slug}
							type="button"
							onClick={() => {
								setAlbumIndex(index)
								setImageIndex(0)
								setLightboxOpen(false)
							}}
							className={`shrink-0 text-[10px] uppercase tracking-[0.18em] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${index === albumIndex ? 'text-white' : 'text-white/35 hover:text-white/75'}`}
							aria-current={index === albumIndex}
						>
							{item.title}
						</button>
					))}
				</nav>
				<GalleryGrid
					images={images}
					selectedIndex={safeImageIndex}
					onSelect={setImageIndex}
					location={album.location}
					onOpen={(index) => {
						setImageIndex(index)
						setLightboxOpen(true)
					}}
				/>
			</div>
			<GalleryLightbox
				images={images}
				index={safeImageIndex}
				open={lightboxOpen}
				onOpenChange={setLightboxOpen}
				onChange={setImageIndex}
				location={album.location}
			/>
		</div>
	)
}
