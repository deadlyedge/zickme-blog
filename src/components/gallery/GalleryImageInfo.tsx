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
			{exif && (
				<div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-white/45 sm:grid-cols-3">
					{(exif.model || exif.make) && (
						<span>
							相机
							<br />
							<b className="font-medium text-white/80">
								{[exif.make, exif.model].filter(Boolean).join(' ')}
							</b>
						</span>
					)}
					{exif.lensModel && (
						<span>
							镜头
							<br />
							<b className="font-medium text-white/80">{exif.lensModel}</b>
						</span>
					)}
					{exif.iso !== undefined && (
						<span>
							ISO
							<br />
							<b className="font-medium text-white/80">{exif.iso}</b>
						</span>
					)}
					{exif.aperture && (
						<span>
							光圈
							<br />
							<b className="font-medium text-white/80">{exif.aperture}</b>
						</span>
					)}
					{exif.exposureTime && (
						<span>
							曝光
							<br />
							<b className="font-medium text-white/80">{exif.exposureTime}</b>
						</span>
					)}
					{exif.focalLength && (
						<span>
							焦距
							<br />
							<b className="font-medium text-white/80">{exif.focalLength}</b>
						</span>
					)}
				</div>
			)}
		</div>
	)
}
