'use client'

import { ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GalleryLightbox } from '@/components/gallery/GalleryLightbox'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { filterGalleriesByTag } from '@/lib/gallery/gallery-public'
import type { GalleryPublic } from '@/types/gallery'

export function GalleryPostView({
	albums,
	initialAlbumSlug,
}: {
	albums: GalleryPublic[]
	initialAlbumSlug?: string
}) {
	const initialAlbum = initialAlbumSlug
		? albums.find((album) => album.slug === initialAlbumSlug)
		: undefined
	const [selectedAlbumSlug, setSelectedAlbumSlug] = useState(
		initialAlbum?.slug ?? albums[0]?.slug ?? '',
	)
	const [activeTag, setActiveTag] = useState<string | null>(null)
	const [imageIndex, setImageIndex] = useState(0)
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const visibleAlbums = filterGalleriesByTag(albums, activeTag)
	const availableTags = Array.from(
		new Set(albums.flatMap((album) => album.tags)),
	)
	const album =
		visibleAlbums.find((item) => item.slug === selectedAlbumSlug) ??
		visibleAlbums[0]
	const images = album?.images ?? []
	const safeImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0))

	useEffect(() => {
		document.body.classList.add('gallery-mode')
		return () => document.body.classList.remove('gallery-mode')
	}, [])

	useEffect(() => {
		const imageId = window.location.hash.startsWith('#image-')
			? window.location.hash.slice('#image-'.length)
			: ''
		if (!imageId || !album) return
		const targetIndex = images.findIndex((image) => image.id === imageId)
		if (targetIndex < 0) return
		setImageIndex(targetIndex)
		if (window.matchMedia('(max-width: 767px)').matches) setLightboxOpen(true)
	}, [album, images])

	const updateImageHash = (imageId: string | undefined) => {
		if (typeof window === 'undefined') return
		const nextUrl = imageId
			? `${window.location.pathname}${window.location.search}#image-${imageId}`
			: `${window.location.pathname}${window.location.search}`
		window.history.replaceState(null, '', nextUrl)
	}

	return (
		<div className="gallery-page h-svh overflow-hidden bg-[#242424] text-[#f5f5f5]">
			<div className="mx-auto flex h-full max-w-7xl flex-col px-4 pb-4 pt-20 sm:px-6 lg:px-8">
				<nav
					className="mb-3 flex shrink-0 items-center gap-5 overflow-x-auto whitespace-nowrap border-b border-white/10 pb-2 text-[10px] uppercase tracking-[0.18em] scrollbar-none [&::-webkit-scrollbar]:hidden"
					aria-label="选择相册"
				>
					<div className="flex shrink-0 items-center gap-1">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className={`inline-flex items-center gap-1 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${activeTag ? 'text-white' : 'text-white/75 hover:text-white'}`}
									aria-label="选择标签筛选"
								>
									{activeTag ?? '全部'}
									<ChevronDown className="size-3" aria-hidden="true" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="start"
								className="min-w-32 border-white/10 bg-[#242424] p-1 text-[10px] uppercase tracking-[0.14em] text-white shadow-xl"
							>
								<DropdownMenuItem
									onClick={() => setActiveTag(null)}
									className="cursor-pointer text-[10px] text-white/75 focus:bg-white/10 focus:text-white"
								>
									全部
								</DropdownMenuItem>
								{availableTags.map((tag) => (
									<DropdownMenuItem
										key={tag}
										onClick={() => setActiveTag(tag)}
										className="cursor-pointer text-[10px] text-white/75 focus:bg-white/10 focus:text-white"
									>
										{tag}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						{activeTag && (
							<button
								type="button"
								onClick={() => setActiveTag(null)}
								className="rounded-full text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
								aria-label="关闭当前标签筛选"
							>
								<X className="size-3" aria-hidden="true" />
							</button>
						)}
					</div>
					{visibleAlbums.map((item) => (
						<button
							key={item.slug}
							type="button"
							onClick={() => {
								setSelectedAlbumSlug(item.slug)
								setImageIndex(0)
								setLightboxOpen(false)
							}}
							className={`shrink-0 text-[10px] uppercase tracking-[0.18em] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${item.slug === album?.slug ? 'text-white' : 'text-white/35 hover:text-white/75'}`}
							aria-current={item.slug === album?.slug}
						>
							{item.title}
						</button>
					))}
				</nav>
				{!album || images.length === 0 ? (
					<div className="flex min-h-0 flex-1 items-center justify-center text-sm text-white/55">
						{activeTag
							? '没有匹配这个标签的相册。'
							: '这个相册暂无可展示的图片。'}
					</div>
				) : (
					<GalleryGrid
						images={images}
						selectedIndex={safeImageIndex}
						onSelect={(index) => {
							setImageIndex(index)
							updateImageHash(images[index]?.id)
						}}
						location={album.location}
						onOpen={(index) => {
							setImageIndex(index)
							setLightboxOpen(true)
							updateImageHash(images[index]?.id)
						}}
					/>
				)}
			</div>
			{album && images.length > 0 && (
				<GalleryLightbox
					images={images}
					index={safeImageIndex}
					open={lightboxOpen}
					onOpenChange={(open) => {
						setLightboxOpen(open)
						if (!open) updateImageHash(undefined)
					}}
					onChange={(index) => {
						setImageIndex(index)
						updateImageHash(images[index]?.id)
					}}
					location={album.location}
				/>
			)}
		</div>
	)
}
