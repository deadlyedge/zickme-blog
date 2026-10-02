import { describe, expect, test } from 'bun:test'
import {
	collectCloudinaryReferences,
	collectSiteProfileAvatarReferences,
	extractCloudinaryPublicId,
	getUnreferencedAssetIds,
	normalizeCloudinaryPublicId,
} from '../src/lib/media/cloudinary-asset-audit'
import { buildSitePublicId } from '../src/lib/media/cloudinary-public-id'

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

	test('keeps site portrait assets referenced by a profile public ID or URL', () => {
		const references = collectSiteProfileAvatarReferences([
			{ avatar: 'site/portrait' },
			{
				avatar:
					'https://res.cloudinary.com/demo/image/upload/v1/myblog/site/portrait.webp',
			},
		])
		expect([...references.keys()]).toEqual(['myblog/site/portrait'])
		expect(
			getUnreferencedAssetIds(
				[
					{ public_id: 'myblog/site/portrait' },
					{ public_id: 'myblog/site/unused' },
				],
				references,
			),
		).toEqual(['myblog/site/unused'])
	})

	test('builds a stable site portrait public ID in its own namespace', () => {
		expect(buildSitePublicId('portrait.webp')).toBe('site/portrait')
	})
})
