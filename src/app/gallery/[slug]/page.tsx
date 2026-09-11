import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GalleryPostView } from '@/components/gallery/GalleryPostView'
import {
	fetchAllGallerySlugs,
	fetchGalleryBySlug,
} from '@/lib/gallery/gallery-queries'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 300

interface PageProps {
	params: Promise<{ slug: string }>
}

export default async function GalleryDetailPage({ params }: PageProps) {
	const { slug } = await params
	const gallery = await fetchGalleryBySlug(slug)
	if (!gallery) notFound()
	return <GalleryPostView albums={[gallery]} />
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const gallery = await fetchGalleryBySlug(slug)
	if (!gallery) return buildMetadata({ title: '相册未找到' })
	return buildMetadata({
		title: gallery.title,
		description: gallery.description || `查看 ${gallery.title}`,
		image: gallery.cover || undefined,
		url: `/gallery/${gallery.slug}`,
	})
}

export async function generateStaticParams() {
	if (process.env.NODE_ENV === 'development') return []
	const slugs = await fetchAllGallerySlugs()
	return slugs.map((slug) => ({ slug }))
}
