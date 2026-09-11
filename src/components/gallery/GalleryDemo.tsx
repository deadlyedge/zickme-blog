'use client'

import { ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

type DemoPhoto = {
	id: string
	title: string
	description: string
	alt: string
	location: string
	date: string
	width: number
	height: number
	src: string
}

const photos: DemoPhoto[] = [
	{
		id: 'misty-mountains',
		title: 'Misty Mountains',
		description:
			'A quiet morning above the clouds, where the landscape slowly wakes up.',
		alt: 'Misty mountain peaks at sunrise',
		location: 'Yunnan, China',
		date: '2024 / 10 / 18',
		width: 1600,
		height: 2200,
		src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
	},
	{
		id: 'blue-hour',
		title: 'Blue Hour',
		description:
			'The last light settles between the buildings before the city turns electric.',
		alt: 'Blue hour city street with lights',
		location: 'Tokyo, Japan',
		date: '2024 / 05 / 06',
		width: 2200,
		height: 1500,
		src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1800&q=85',
	},
	{
		id: 'desert-lines',
		title: 'Desert Lines',
		description:
			'Wind, light and distance drawing temporary geometry across the sand.',
		alt: 'Abstract lines in golden desert sand',
		location: 'Gansu, China',
		date: '2023 / 11 / 22',
		width: 1600,
		height: 2100,
		src: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1600&q=85',
	},
	{
		id: 'quiet-coast',
		title: 'Quiet Coast',
		description:
			'A small pause at the edge of the sea, under a sky that keeps changing.',
		alt: 'Rocky coast and calm blue ocean',
		location: 'Jeju, Korea',
		date: '2023 / 08 / 14',
		width: 2200,
		height: 1460,
		src: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85',
	},
	{
		id: 'forest-path',
		title: 'Forest Path',
		description: 'Soft green light and an unfinished path through the trees.',
		alt: 'A path through a green forest',
		location: 'Nagano, Japan',
		date: '2022 / 06 / 02',
		width: 1600,
		height: 2300,
		src: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=85',
	},
	{
		id: 'winter-window',
		title: 'Winter Window',
		description: 'Warm light from inside, reflected on a cold winter evening.',
		alt: 'Warmly lit window on a winter evening',
		location: 'Hokkaido, Japan',
		date: '2022 / 01 / 19',
		width: 2200,
		height: 1650,
		src: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1800&q=85',
	},
]

const albums = [
	{
		id: 'field-notes',
		title: 'Field Notes',
		description: 'Places, light and passing moments.',
		photos,
	},
	{
		id: 'slow-city',
		title: 'Slow City',
		description: 'Quiet streets, reflections and blue hour.',
		photos: [photos[1], photos[3], photos[5]],
	},
	{
		id: 'open-land',
		title: 'Open Land',
		description: 'Mountains, coastlines and long horizons.',
		photos: [photos[0], photos[2], photos[4]],
	},
]

function PhotoInfo({
	photo,
	compact = false,
}: {
	photo: DemoPhoto
	compact?: boolean
}) {
	return (
		<div className={compact ? 'space-y-2' : 'space-y-4'}>
			<div>
				<p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
					{photo.location} · {photo.date}
				</p>
				<h2
					className={
						compact ? 'text-xl font-semibold' : 'text-2xl font-semibold'
					}
				>
					{photo.title}
				</h2>
			</div>
			<p className="max-w-xl text-sm leading-6 text-white/65">
				{photo.description}
			</p>
			<div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs text-white/45">
				<span>
					Camera
					<br />
					<b className="font-medium text-white/80">Leica Q3</b>
				</span>
				<span>
					ISO
					<br />
					<b className="font-medium text-white/80">100</b>
				</span>
				<span>
					f / 2.8
					<br />
					<b className="font-medium text-white/80">1 / 250s</b>
				</span>
			</div>
		</div>
	)
}

export function GalleryDemo() {
	const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0)
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [lightboxOpen, setLightboxOpen] = useState(false)
	const selectedAlbum = albums[selectedAlbumIndex]
	const selectedPhotos = selectedAlbum.photos
	const selectedPhoto = selectedPhotos[selectedIndex] ?? selectedPhotos[0]

	const changePhoto = useCallback(
		(direction: number) => {
			setSelectedIndex(
				(current) =>
					(current + direction + selectedPhotos.length) % selectedPhotos.length,
			)
		},
		[selectedPhotos.length],
	)

	const selectAlbum = (index: number) => {
		setSelectedAlbumIndex(index)
		setSelectedIndex(0)
		setLightboxOpen(false)
	}

	useEffect(() => {
		document.body.classList.add('gallery-mode')
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!lightboxOpen) return
			if (event.key === 'Escape') setLightboxOpen(false)
			if (event.key === 'ArrowLeft') changePhoto(-1)
			if (event.key === 'ArrowRight') changePhoto(1)
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
			document.body.classList.remove('gallery-mode')
		}
	}, [changePhoto, lightboxOpen])

	return (
		<div className="gallery-page h-svh overflow-hidden bg-[#242424] text-[#f5f5f5]">
			<div className="mx-auto flex h-full max-w-7xl flex-col px-4 pb-4 pt-20 sm:px-6 lg:px-8">
				<nav
					className="mb-3 flex shrink-0 gap-5 overflow-x-auto whitespace-nowrap border-b border-white/10 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
					aria-label="选择相册"
				>
					{albums.map((album, index) => (
						<button
							key={album.id}
							type="button"
							onClick={() => selectAlbum(index)}
							className={`shrink-0 text-[10px] uppercase tracking-[0.18em] transition-colors ${index === selectedAlbumIndex ? 'text-white' : 'text-white/35 hover:text-white/75'}`}
							aria-current={index === selectedAlbumIndex}
						>
							{album.title}
						</button>
					))}
				</nav>

				<section className="hidden min-h-0 flex-1 grid-cols-[minmax(0,1fr)_clamp(6rem,13vw,10rem)] gap-5 md:grid">
					<div className="relative min-h-0 overflow-hidden pr-1">
						<div className="group/stage relative h-full w-full overflow-hidden rounded-sm bg-[#2f2f2f]">
							<Image
								src={selectedPhoto.src}
								alt={selectedPhoto.alt}
								fill
								priority
								loading="eager"
								sizes="(min-width: 768px) 75vw, 100vw"
								className="object-contain"
							/>
							<span className="group/info absolute inset-x-0 bottom-0 z-10 flex justify-end">
								<span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-black/55 p-5 text-white opacity-0 shadow-2xl backdrop-blur-md transition duration-300 group-hover/info:pointer-events-auto group-hover/info:translate-y-0 group-hover/info:opacity-100 group-focus-within/info:pointer-events-auto group-focus-within/info:translate-y-0 group-focus-within/info:opacity-100">
									<PhotoInfo photo={selectedPhoto} compact />
								</span>
								<span className="relative z-10 pointer-events-auto m-4 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/85 backdrop-blur transition hover:bg-black/70">
									<Info className="size-4" />
								</span>
							</span>
						</div>
					</div>
					<div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
						{selectedPhotos.map((photo, index) => (
							<button
								key={photo.id}
								type="button"
								onClick={() => setSelectedIndex(index)}
								className={`group relative aspect-3/4 shrink-0 overflow-hidden rounded-sm text-left ring-1 transition ${index === selectedIndex ? 'ring-white' : 'ring-white/10 opacity-55 hover:opacity-100'}`}
								aria-label={`选择 ${photo.title}`}
								aria-current={index === selectedIndex}
							>
								<Image
									src={photo.src}
									alt=""
									fill
									sizes="160px"
									className="object-cover"
								/>
								<span className="absolute bottom-2 left-2 text-[10px] text-white/80">
									0{index + 1}
								</span>
							</button>
						))}
					</div>
				</section>

				<section className="grid min-h-0 flex-1 grid-cols-2 items-start gap-3 overflow-x-hidden overflow-y-auto md:hidden">
					{[0, 1].map((column) => (
						<div key={column} className="min-w-0 space-y-3">
							{selectedPhotos.map((photo, index) => {
								if (index % 2 !== column) return null
								return (
									<button
										key={photo.id}
										type="button"
										onClick={() => {
											setSelectedIndex(index)
											setLightboxOpen(true)
										}}
										className="group block w-full text-left"
									>
										<div
											className="relative overflow-hidden rounded-sm bg-[#2f2f2f]"
											style={{
												aspectRatio: `${photo.width} / ${photo.height}`,
											}}
										>
											<Image
												src={photo.src}
												alt={photo.alt}
												fill
												sizes="50vw"
												className="object-cover"
											/>
										</div>
										<div className="px-1 pb-1 pt-2">
											<p className="text-sm font-medium">{photo.title}</p>
											<p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
												0{index + 1} · {photo.location}
											</p>
										</div>
									</button>
								)
							})}
						</div>
					))}
				</section>
			</div>

			{lightboxOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-[#151515]/95 p-0 backdrop-blur-md sm:p-4"
					role="dialog"
					aria-modal="true"
					aria-label={`${selectedPhoto.title} 图片预览`}
				>
					<button
						type="button"
						className="absolute inset-0"
						aria-label="点击关闭图片预览"
						onClick={() => setLightboxOpen(false)}
					/>
					<button
						type="button"
						className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-white/10 p-3 text-white hover:bg-white/20"
						onClick={() => setLightboxOpen(false)}
						aria-label="关闭图片预览"
					>
						<X className="size-5" />
					</button>
					<button
						type="button"
						className="absolute left-3 top-1/2 z-10 rounded-full border border-white/15 bg-white/10 p-3 text-white hover:bg-white/20"
						onClick={(event) => {
							event.stopPropagation()
							changePhoto(-1)
						}}
						aria-label="上一张"
					>
						<ChevronLeft className="size-5" />
					</button>
					<div className="relative h-full w-full max-w-6xl">
						<div className="absolute inset-0">
							<Image
								src={selectedPhoto.src}
								alt={selectedPhoto.alt}
								fill
								sizes="100vw"
								className="object-contain"
							/>
						</div>
						<div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-2xl rounded-sm bg-[#2f2f2f]/95 p-5 text-white shadow-2xl backdrop-blur">
							<PhotoInfo photo={selectedPhoto} compact />
						</div>
					</div>
					<button
						type="button"
						className="absolute right-3 top-1/2 z-10 rounded-full border border-white/15 bg-white/10 p-3 text-white hover:bg-white/20"
						onClick={(event) => {
							event.stopPropagation()
							changePhoto(1)
						}}
						aria-label="下一张"
					>
						<ChevronRight className="size-5" />
					</button>
				</div>
			)}
		</div>
	)
}
