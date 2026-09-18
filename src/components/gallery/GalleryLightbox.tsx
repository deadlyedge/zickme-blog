'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { GalleryBottomPanel } from '@/components/gallery/GalleryBottomPanel'
import { GalleryImagePreloads } from '@/components/gallery/GalleryImagePreloads'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog'
import type { GalleryPublicImage } from '@/types/gallery'

export function GalleryLightbox({
	images,
	index,
	open,
	onOpenChange,
	onChange,
	location,
}: {
	images: GalleryPublicImage[]
	index: number
	open: boolean
	onOpenChange: (open: boolean) => void
	onChange: (index: number) => void
	location?: string
}) {
	const [carouselRef, carouselApi] = useEmblaCarousel({
		loop: false,
		startIndex: index,
		duration: 25,
	})
	const [currentIndex, setCurrentIndex] = useState(index)
	const [failedImageIds, setFailedImageIds] = useState<Set<string>>(
		() => new Set(),
	)
	const image = images[currentIndex]
	const move = useCallback(
		(direction: number) => {
			const nextIndex = Math.max(
				0,
				Math.min(currentIndex + direction, images.length - 1),
			)
			carouselApi?.scrollTo(nextIndex)
		},
		[carouselApi, currentIndex, images.length],
	)
	useEffect(() => {
		if (!carouselApi) return
		const handleSelect = () => {
			const nextIndex = carouselApi.selectedScrollSnap()
			setCurrentIndex(nextIndex)
			onChange(nextIndex)
		}
		handleSelect()
		carouselApi.on('select', handleSelect)
		return () => {
			carouselApi.off('select', handleSelect)
		}
	}, [carouselApi, onChange])
	useEffect(() => {
		if (!carouselApi || carouselApi.selectedScrollSnap() === index) return
		carouselApi.scrollTo(index, true)
	}, [carouselApi, index])
	useEffect(() => {
		if (!open) return
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowLeft') move(-1)
			if (event.key === 'ArrowRight') move(1)
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [open, move])
	if (!image) return null
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="h-svh w-screen max-w-none rounded-none border-0 bg-[#151515]/95 p-0 text-white shadow-none backdrop-blur-md sm:h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)] sm:rounded-sm"
			>
				<DialogTitle className="sr-only">
					{image.title || '图片预览'}
				</DialogTitle>
				<DialogDescription className="sr-only">
					使用左右方向键或触摸滑动切换图片，按 Escape 关闭。
				</DialogDescription>
				<GalleryImagePreloads
					images={images}
					selectedIndex={currentIndex}
					sizes="100vw"
				/>
				<div className="absolute inset-x-0 top-0 z-20 h-10 bg-linear-to-b from-black/45 to-transparent">
					<div
						className="absolute inset-x-0 top-0 h-0.5 bg-white/20"
						role="progressbar"
						aria-label="相册图片进度"
						aria-valuemin={1}
						aria-valuemax={images.length}
						aria-valuenow={currentIndex + 1}
					>
						<div
							className="h-full bg-white transition-[width] duration-300 motion-reduce:transition-none"
							style={{
								width: `${((currentIndex + 1) / images.length) * 100}%`,
							}}
						/>
					</div>
					<span className="absolute left-3 top-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] tabular-nums text-white/80">
						{String(currentIndex + 1).padStart(2, '0')} /{' '}
						{String(images.length).padStart(2, '0')}
					</span>
				</div>
				<button
					type="button"
					onClick={() => onOpenChange(false)}
					aria-label="关闭图片预览"
					className="absolute right-4 top-4 z-30 rounded-full bg-black/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
				>
					<X className="size-5" />
				</button>
				<div ref={carouselRef} className="h-full overflow-hidden touch-pan-y">
					<div className="flex h-full">
						{images.map((item) => (
							<div
								key={item.id}
								className="relative min-w-0 shrink-0 grow-0 basis-full"
							>
								{failedImageIds.has(item.id) ? (
									<div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/60">
										图片暂时无法加载
									</div>
								) : (
									<Image
										src={item.url}
										alt={item.alt}
										fill
										loading={item.id === image.id ? 'eager' : 'lazy'}
										sizes="100vw"
										className="object-contain"
										onError={() =>
											setFailedImageIds((current) => {
												const next = new Set(current)
												next.add(item.id)
												return next
											})
										}
									/>
								)}
							</div>
						))}
					</div>
				</div>
				<GalleryBottomPanel key={image.id} image={image} location={location} />
			</DialogContent>
		</Dialog>
	)
}
