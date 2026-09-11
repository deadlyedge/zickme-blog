import type { Metadata } from 'next'
import { GalleryPostView } from '@/components/gallery/GalleryPostView'
import { fetchGalleries } from '@/lib/gallery/gallery-queries'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
	title: 'Photo Gallery',
	description: '浏览摄影相册与图片记录。',
	url: '/gallery',
})

export default async function GalleryPage() {
	const galleries = await fetchGalleries()
	return galleries.length > 0 ? (
		<GalleryPostView albums={galleries} />
	) : (
		<div className="flex min-h-svh items-center justify-center bg-[#242424] text-sm text-white/55">
			暂无已发布的相册。
		</div>
	)
}
