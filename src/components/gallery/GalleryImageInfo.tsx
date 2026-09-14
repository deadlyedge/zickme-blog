import { ExifPanel } from '@/components/gallery/ExifPanel'
import type { GalleryPublicImage } from '@/types/gallery'

export function GalleryImageInfo({
	image,
	location,
	compact = false,
}: {
	image: GalleryPublicImage
	location?: string
	compact?: boolean
}) {
	const exif = image.exif
	return (
		<div className={compact ? 'space-y-2' : 'space-y-4'}>
			<div className={compact ? 'min-w-0' : undefined}>
				{(location || exif?.capturedAt) && (
					<p className="mb-1 text-[10px] uppercase text-white/45">
						{[location, exif?.capturedAt].filter(Boolean).join(' · ')}
					</p>
				)}
				{compact ? (
					<div className="flex min-w-0 items-center gap-3 pr-12">
						<h2 className="min-w-0 max-w-[45%] truncate text-base font-semibold">
							{image.title || 'Untitled'}
						</h2>
						<ExifPanel exif={exif} compact />
					</div>
				) : (
					<h2 className="text-2xl font-semibold">
						{image.title || 'Untitled'}
					</h2>
				)}
			</div>
			{image.description && (
				<p className="max-w-xl text-sm leading-6 text-white/65">
					{image.description}
				</p>
			)}
			{!compact && <ExifPanel exif={exif} />}
		</div>
	)
}
