// Compatibility entrypoint for existing `@/types/gallery` imports.
export type {
	Gallery,
	GalleryAlbumFrontmatter,
	GalleryIndexEntry,
	GalleryLayout,
	GallerySort,
	GalleryStatus,
} from './gallery/album'
export type {
	GalleryExif,
	GalleryImage,
	GalleryImageFrontmatter,
	GalleryImageSyncStatus,
	GallerySyncStatus,
} from './gallery/image'
export type { GalleryPublic, GalleryPublicImage } from './gallery/public'
