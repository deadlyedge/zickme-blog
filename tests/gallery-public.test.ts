import { describe, expect, test } from 'bun:test'
import { formatGalleryExposureTime } from '../src/lib/gallery/exif'
import {
	filterGalleriesByTag,
	getGalleryImageUrl,
	parseGalleryTags,
} from '../src/lib/gallery/gallery-public'
import { buildGalleryPublicId } from '../src/lib/media/gallery-media'
import { buildPostMediaPublicId } from '../src/lib/media/post-media'
import type { GalleryPublic } from '../src/types/gallery'
import type { GalleryPublic as DomainGalleryPublic } from '../src/types/gallery/public'

const image = {
	id: 'image-1',
	url: 'https://cdn.example.com/full.webp',
	thumbnailUrl: 'https://cdn.example.com/thumb.webp',
	title: null,
	description: null,
	alt: 'Test image',
	width: 1200,
	height: 800,
	exif: null,
}

const albums = [
	{ slug: 'travel', tags: ['travel', 'photo'] },
	{ slug: 'game-art', tags: ['game'] },
].map(
	(album) =>
		({
			...album,
			title: album.slug,
			description: null,
			cover: null,
			status: 'PUBLISHED',
			images: [],
		}) as GalleryPublic,
)

describe('gallery public helpers', () => {
	test('uses separate stable Cloudinary namespaces for Gallery and Post media', () => {
		expect(buildGalleryPublicId('Travel Album', 'IMG_001.webp')).toBe(
			'gallery/Travel-Album/IMG_001',
		)
		expect(buildPostMediaPublicId('my-post', 'assets/cover.png')).toBe(
			'posts/my-post/cover',
		)
	})

	test('formats exposure time as a readable shutter speed', () => {
		expect(formatGalleryExposureTime('0.01666666666')).toBe('1/60s')
		expect(formatGalleryExposureTime('0.01')).toBe('1/100s')
		expect(formatGalleryExposureTime('1/100')).toBe('1/100s')
		expect(formatGalleryExposureTime('1/100s')).toBe('1/100s')
	})

	test('uses thumbnails for previews and full images for the main view', () => {
		expect(getGalleryImageUrl(image, 'thumbnail')).toBe(image.thumbnailUrl)
		expect(getGalleryImageUrl(image, 'full')).toBe(image.url)
		expect(
			getGalleryImageUrl({ ...image, thumbnailUrl: null }, 'thumbnail'),
		).toBe(image.url)
	})

	test('parses only unique non-empty string tags', () => {
		expect(
			parseGalleryTags({ tags: ['travel', '', 'travel', 42, ' photo '] }),
		).toEqual(['travel', ' photo '])
		expect(parseGalleryTags(null)).toEqual([])
		expect(parseGalleryTags({ tags: 'travel' })).toEqual([])
	})

	test('filters albums by one tag and keeps all albums without a tag', () => {
		expect(
			filterGalleriesByTag(albums, 'travel').map(({ slug }) => slug),
		).toEqual(['travel'])
		expect(filterGalleriesByTag(albums, null)).toEqual(albums)
	})

	test('gallery public DTO is available from the domain module', () => {
		const gallery: DomainGalleryPublic = albums[0] as DomainGalleryPublic
		expect(gallery.slug).toBe('travel')
	})
})
