import { GalleryPostView } from '@/components/gallery/GalleryPostView'
import type { GalleryPublic } from '@/types/gallery'

/** @deprecated Use GalleryPostView for production Gallery pages. */
export function GalleryDemo({ albums }: { albums: GalleryPublic[] }) {
	return <GalleryPostView albums={albums} />
}
