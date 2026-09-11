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
			<div>
				{(location || exif?.capturedAt) && (
					<p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/45">
						{[location, exif?.capturedAt].filter(Boolean).join(' · ')}
					</p>
				)}
				<h2
					className={
						compact ? 'text-xl font-semibold' : 'text-2xl font-semibold'
					}
				>
					{image.title || 'Untitled'}
				</h2>
			</div>
			{image.description && (
				<p className="max-w-xl text-sm leading-6 text-white/65">
					{image.description}
				</p>
			)}
			<ExifPanel exif={exif} />
		</div>
	)
}
