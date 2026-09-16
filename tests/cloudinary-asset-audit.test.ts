import { describe, expect, test } from 'bun:test'
import {
	collectCloudinaryReferences,
	extractCloudinaryPublicId,
	getUnreferencedAssetIds,
	normalizeCloudinaryPublicId,
} from '../src/lib/media/cloudinary-asset-audit'

describe('Cloudinary asset audit helpers', () => {
	test('normalizes public IDs and delivery URLs to the same asset', () => {
		expect(normalizeCloudinaryPublicId('myblog/gallery/travel/photo')).toBe(
			'myblog/gallery/travel/photo',
		)
		expect(normalizeCloudinaryPublicId('gallery/travel/photo.webp')).toBe(
			'myblog/gallery/travel/photo',
		)
		expect(
			extractCloudinaryPublicId(
				'https://res.cloudinary.com/demo/image/upload/c_limit,w_320/v1/myblog/gallery/travel/photo.webp',
			),
		).toBe('myblog/gallery/travel/photo')
	})

	test('collects references from URLs, public IDs, and Markdown content', () => {
		const references = collectCloudinaryReferences([
			{ value: 'myblog/posts/demo/cover', source: 'poster' },
			{
				value:
					'![photo](https://res.cloudinary.com/demo/image/upload/v1/myblog/gallery/a/photo.webp)',
				source: 'content',
			},
		])
		expect([...references.keys()]).toEqual([
			'myblog/posts/demo/cover',
			'myblog/gallery/a/photo',
		])
	})

	test('returns only assets absent from the current reference set', () => {
		const references = collectCloudinaryReferences([
			{ value: 'myblog/gallery/used/photo', source: 'db' },
		])
		expect(
			getUnreferencedAssetIds(
				[
					{ public_id: 'myblog/gallery/used/photo' },
					{ public_id: 'myblog/gallery/old/photo' },
				],
				references,
			),
		).toEqual(['myblog/gallery/old/photo'])
	})
})
