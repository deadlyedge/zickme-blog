import { describe, expect, test } from 'bun:test'
import {
	filterGalleriesByTag,
	parseGalleryTags,
} from '../src/lib/gallery/gallery-public'
import type { GalleryPublic } from '../src/types/gallery'

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
})
