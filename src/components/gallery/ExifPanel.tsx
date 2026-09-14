import { Aperture, Camera } from 'lucide-react'
import { formatGalleryExposureTime } from '@/lib/gallery/exif'
import type { GalleryExif } from '@/types/gallery'

export function ExifPanel({
	exif,
	compact = false,
}: {
	exif: GalleryExif | null
	compact?: boolean
}) {
	if (!exif) return null
	if (compact) {
		const camera = [exif.make, exif.model].filter(Boolean).join(' ')
		const items = [
			camera && { icon: Camera, value: camera },
			exif.iso !== undefined && { value: `ISO${exif.iso}` },
			exif.aperture && { icon: Aperture, value: exif.aperture },
			exif.exposureTime && {
				value: formatGalleryExposureTime(exif.exposureTime),
			},
		].filter(Boolean) as { icon?: typeof Camera; value: string }[]
		if (items.length === 0) return null
		return (
			<div className="flex min-w-0 flex-1 items-center truncate text-left font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-white/45">
				{items.map((item, index) => (
					<span
						key={`${item.value}-${item.icon ? 'icon' : 'text'}`}
						className="inline-flex items-center gap-0.5 leading-none"
					>
						{item.icon && (
							<item.icon
								className="size-2.5 shrink-0 self-center"
								aria-hidden="true"
							/>
						)}
						<span>{item.value}</span>
						{index < items.length - 1 && (
							<span className="px-1 text-white/25">/</span>
						)}
					</span>
				))}
			</div>
		)
	}
	const items = [
		{ label: '相机', value: [exif.make, exif.model].filter(Boolean).join(' ') },
		{ label: '镜头', value: exif.lensModel },
		{ label: 'ISO', value: exif.iso },
		{ label: '光圈', value: exif.aperture },
		{
			label: '曝光',
			value: exif.exposureTime
				? formatGalleryExposureTime(exif.exposureTime)
				: undefined,
		},
		{ label: '焦距', value: exif.focalLength },
	].filter((item) => item.value !== undefined && item.value !== '')
	if (items.length === 0) return null
	return (
		<div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-white/45 sm:grid-cols-3">
			{items.map((item) => (
				<span key={item.label}>
					{item.label}
					<br />
					<b className="font-medium text-white">{item.value}</b>
				</span>
			))}
		</div>
	)
}
