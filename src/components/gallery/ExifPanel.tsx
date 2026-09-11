import type { GalleryExif } from '@/types/gallery'

export function ExifPanel({ exif }: { exif: GalleryExif | null }) {
	if (!exif) return null
	const items = [
		{ label: '相机', value: [exif.make, exif.model].filter(Boolean).join(' ') },
		{ label: '镜头', value: exif.lensModel },
		{ label: 'ISO', value: exif.iso },
		{ label: '光圈', value: exif.aperture },
		{ label: '曝光', value: exif.exposureTime },
		{ label: '焦距', value: exif.focalLength },
	].filter((item) => item.value !== undefined && item.value !== '')
	if (items.length === 0) return null
	return (
		<div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-xs text-white/45 sm:grid-cols-3">
			{items.map((item) => (
				<span key={item.label}>
					{item.label}
					<br />
					<b className="font-medium text-white/80">{item.value}</b>
				</span>
			))}
		</div>
	)
}
