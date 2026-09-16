export type HomeGalleryCardOrientation = 'landscape' | 'portrait'

export function getHomeGalleryCardOrientation(
	width: number | null,
	height: number | null,
): HomeGalleryCardOrientation {
	if (typeof width !== 'number' || typeof height !== 'number')
		return 'landscape'
	return width > height ? 'landscape' : 'portrait'
}
