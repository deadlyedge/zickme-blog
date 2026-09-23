import {
	GALLERY_ROOT,
	type GalleryScanResult,
	scanGalleryDirectory,
} from '../../src/lib/gallery/gallery-parser'

export function checkGalleries(
	root = GALLERY_ROOT,
): Promise<GalleryScanResult> {
	return scanGalleryDirectory(root)
}
