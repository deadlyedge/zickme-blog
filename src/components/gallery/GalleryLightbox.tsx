'use client'

import {
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ExternalLink,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { GalleryImageInfo } from '@/components/gallery/GalleryImageInfo'
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
	const image = images[index]
	const touchStart = useRef<number | null>(null)
	const [minimized, setMinimized] = useState(false)
	const [failedImageId, setFailedImageId] = useState<string | null>(null)
	const move = useCallback(
		(direction: number) =>
			onChange((index + direction + images.length) % images.length),
		[index, images.length, onChange],
	)
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
				<div
					className="relative flex h-full w-full items-center justify-center"
					onTouchStart={(event) => {
						touchStart.current = event.touches[0]?.clientX ?? null
					}}
					onTouchEnd={(event) => {
						if (touchStart.current === null) return
						const delta =
							(event.changedTouches[0]?.clientX ?? 0) - touchStart.current
						if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1)
						touchStart.current = null
					}}
				>
					{failedImageId === image.id ? (
						<div className="px-8 text-center text-sm text-white/60">
							图片暂时无法加载
						</div>
					) : (
						<Image
							src={image.url}
							alt={image.alt}
							fill
							sizes="100vw"
							className="object-contain"
							onError={() => setFailedImageId(image.id)}
						/>
					)}
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						aria-label="关闭图片预览"
						className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<X className="size-5" />
					</button>
					<button
						type="button"
						onClick={() => move(-1)}
						aria-label="上一张"
						className="absolute left-3 top-1/2 z-20 rounded-full bg-black/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<ChevronLeft />
					</button>
					<button
						type="button"
						onClick={() => move(1)}
						aria-label="下一张"
						className="absolute right-3 top-1/2 z-20 rounded-full bg-black/50 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
					>
						<ChevronRight />
					</button>
					<div
						className={`absolute inset-x-0 bottom-0 z-20 mx-auto max-w-2xl bg-black/65 p-4 backdrop-blur-md transition-opacity motion-reduce:transition-none ${minimized ? 'py-3' : ''}`}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0">
								{minimized ? (
									<h2 className="truncate text-lg font-semibold">
										{image.title || 'Untitled'}
									</h2>
								) : (
									<GalleryImageInfo image={image} location={location} compact />
								)}
							</div>
							<button
								type="button"
								onClick={() => setMinimized((value) => !value)}
								aria-label={minimized ? '展开图片信息' : '最小化图片信息'}
								className="rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
							>
								<ChevronUp
									className={`size-4 transition-transform motion-reduce:transition-none ${minimized ? 'rotate-180' : ''}`}
								/>
							</button>
						</div>
						<a
							href={image.url}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 inline-flex items-center gap-1 text-xs text-white/60 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
						>
							在新标签页打开 <ExternalLink className="size-3" />
						</a>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
