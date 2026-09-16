'use client'

import Image from 'next/image'
import type { GalleryPublicImage } from '@/types/gallery'

const PRELOAD_RADIUS = 1

function getPreloadIndexes(length: number, selectedIndex: number): number[] {
	if (length === 0) return []

	return Array.from(
		{ length: Math.min(length, PRELOAD_RADIUS * 2 + 1) },
		(_, offset) => {
			const relativeIndex = offset - PRELOAD_RADIUS
			return (selectedIndex + relativeIndex + length) % length
		},
	)
		.filter((index) => index !== selectedIndex)
		.filter((index, position, indexes) => indexes.indexOf(index) === position)
}

export function GalleryImagePreloads({
	images,
	selectedIndex,
	sizes,
}: {
	images: GalleryPublicImage[]
	selectedIndex: number
	sizes: string
}) {
	const preloadImages = getPreloadIndexes(images.length, selectedIndex)

	return (
		<div
			className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
			aria-hidden="true"
		>
			{preloadImages.map((index) => {
				const image = images[index]
				return (
					<div key={image.id} className="relative h-px w-px">
						<Image
							src={image.url}
							alt=""
							fill
							loading="eager"
							sizes={sizes}
							aria-hidden="true"
						/>
					</div>
				)
			})}
		</div>
	)
}
