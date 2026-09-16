import type { GalleryExif } from '../gallery/image'
import type { SiteProfile } from '../site'
import type { PostWithTags } from './post'

export interface HomeRecentGallery {
	slug: string
	title: string
	href: string
	coverUrl: string
	coverTitle: string | null
	width: number | null
	height: number | null
}

export interface HomeGalleryImage {
	id: string
	title: string | null
	href: string
	imageUrl: string
	thumbnailUrl: string | null
	gallerySlug: string
	galleryTitle: string
	tags: string[]
	width: number | null
	height: number | null
	exif: GalleryExif | null
	commentCount: number
}

export interface HomePageData {
	profile: SiteProfile | null
	latestPosts: PostWithTags[]
	hottestPosts?: PostWithTags[]
	hotGalleryImages?: HomeGalleryImage[]
	recentGalleries?: HomeRecentGallery[]
	pinnedPosts?: PostWithTags[]
}
