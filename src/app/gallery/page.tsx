import type { Metadata } from 'next'
import { GalleryDemo } from '@/components/gallery/GalleryDemo'

export const metadata: Metadata = {
	title: 'Photo Gallery · Zick.me',
	description: 'A visual preview of the photo gallery experience.',
}

export default function GalleryPage() {
	return <GalleryDemo />
}
