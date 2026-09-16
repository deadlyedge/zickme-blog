import { describe, expect, test } from 'bun:test'
import { getHomeGalleryCardOrientation } from '../src/lib/gallery/home-presentation'

describe('home gallery presentation', () => {
	test('uses landscape cards for horizontal images', () => {
		expect(getHomeGalleryCardOrientation(1600, 900)).toBe('landscape')
	})

	test('uses portrait cards for vertical and square images', () => {
		expect(getHomeGalleryCardOrientation(900, 1600)).toBe('portrait')
		expect(getHomeGalleryCardOrientation(1000, 1000)).toBe('portrait')
	})

	test('falls back to landscape when dimensions are unavailable', () => {
		expect(getHomeGalleryCardOrientation(null, 1000)).toBe('landscape')
		expect(getHomeGalleryCardOrientation(1000, null)).toBe('landscape')
	})
})
