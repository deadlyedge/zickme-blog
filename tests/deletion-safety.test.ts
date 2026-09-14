import { beforeEach, describe, expect, test } from 'bun:test'
import {
	buildDeletionPreview,
	createDeletionPreviewToken,
	verifyDeletionPreviewToken,
} from '../src/lib/deletion/deletion-safety'

const secret = 'stage12-test-secret'

describe('deletion safety', () => {
	beforeEach(() => {
		process.env.BETTER_AUTH_SECRET = secret
	})

	test('preview includes impact and a signed expiring token', () => {
		const now = new Date('2026-09-14T00:00:00.000Z')
		const preview = buildDeletionPreview(
			{ type: 'galleryImage', id: 'image-1' },
			{
				version: '2026-09-13T00:00:00.000Z',
				commentCount: 3,
				media: [
					{
						id: 'image-1',
						publicId: 'gallery/image-1',
						sourcePath: 'image.webp',
					},
				],
			},
			now,
		)

		expect(preview.commentCount).toBe(3)
		expect(preview.cloudinaryDeletion).toBe('NOT_REQUESTED')
		expect(
			verifyDeletionPreviewToken(
				preview.previewToken,
				{ type: preview.type, id: preview.id, version: preview.version },
				now,
			),
		).toBe(true)
	})

	test('expired, changed, forged, and wrong-entity tokens are rejected', () => {
		const payload = {
			type: 'post' as const,
			id: 'post-1',
			version: 'v1',
			expiresAt: '2026-09-14T00:05:00.000Z',
		}
		const token = createDeletionPreviewToken(payload, secret)
		const expected = { type: 'post' as const, id: 'post-1', version: 'v1' }
		expect(
			verifyDeletionPreviewToken(
				token,
				expected,
				new Date('2026-09-14T00:04:00.000Z'),
				secret,
			),
		).toBe(true)
		expect(
			verifyDeletionPreviewToken(
				token,
				{ ...expected, version: 'v2' },
				new Date('2026-09-14T00:04:00.000Z'),
				secret,
			),
		).toBe(false)
		expect(
			verifyDeletionPreviewToken(
				token,
				{ ...expected, id: 'post-2' },
				new Date('2026-09-14T00:04:00.000Z'),
				secret,
			),
		).toBe(false)
		expect(
			verifyDeletionPreviewToken(
				`${token}x`,
				expected,
				new Date('2026-09-14T00:04:00.000Z'),
				secret,
			),
		).toBe(false)
		expect(
			verifyDeletionPreviewToken(
				token,
				expected,
				new Date('2026-09-14T00:06:00.000Z'),
				secret,
			),
		).toBe(false)
	})
})
