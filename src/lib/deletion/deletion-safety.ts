import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

export const deletionEntityTypes = ['post', 'gallery', 'galleryImage'] as const
export type DeletionEntityType = (typeof deletionEntityTypes)[number]

export const deletionPreviewInputSchema = z.object({
	type: z.enum(deletionEntityTypes),
	id: z.string().trim().min(1).max(128),
})

export const deletionConfirmationInputSchema =
	deletionPreviewInputSchema.extend({
		previewToken: z.string().min(1).max(4096),
		confirmation: z.literal('DELETE'),
	})

export type DeletionPreviewInput = z.infer<typeof deletionPreviewInputSchema>

export type DeletionPreview = {
	type: DeletionEntityType
	id: string
	version: string
	expiresAt: string
	commentCount: number
	media: Array<{
		id: string
		publicId: string | null
		sourcePath: string
	}>
	cloudinaryDeletion: 'NOT_REQUESTED'
	rollback: {
		database: string
		git: string
		cloudinary: string
	}
}

type TokenPayload = Pick<
	DeletionPreview,
	'type' | 'id' | 'version' | 'expiresAt'
>

function getTokenSecret(): string | null {
	return process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || null
}

function encode(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64url')
}

function sign(value: string, secret: string): string {
	return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createDeletionPreviewToken(
	payload: TokenPayload,
	secret = getTokenSecret(),
): string {
	if (!secret) throw new Error('未配置删除预览签名密钥')
	const encodedPayload = encode(JSON.stringify(payload))
	return `${encodedPayload}.${sign(encodedPayload, secret)}`
}

export function verifyDeletionPreviewToken(
	token: string,
	expected: Pick<TokenPayload, 'type' | 'id' | 'version'>,
	now = new Date(),
	secret = getTokenSecret(),
): boolean {
	if (!secret) return false
	const [encodedPayload, signature] = token.split('.')
	if (!encodedPayload || !signature) return false

	const expectedSignature = sign(encodedPayload, secret)
	const actualBuffer = Buffer.from(signature)
	const expectedBuffer = Buffer.from(expectedSignature)
	if (
		actualBuffer.length !== expectedBuffer.length ||
		!timingSafeEqual(actualBuffer, expectedBuffer)
	)
		return false

	try {
		const payload = JSON.parse(
			Buffer.from(encodedPayload, 'base64url').toString('utf8'),
		) as TokenPayload
		return (
			payload.type === expected.type &&
			payload.id === expected.id &&
			payload.version === expected.version &&
			new Date(payload.expiresAt).getTime() > now.getTime()
		)
	} catch {
		return false
	}
}

export function buildDeletionPreview(
	input: DeletionPreviewInput,
	data: Omit<
		DeletionPreview,
		keyof DeletionPreviewInput | 'expiresAt' | 'cloudinaryDeletion' | 'rollback'
	> &
		Pick<DeletionPreview, 'version' | 'commentCount' | 'media'>,
	now = new Date(),
	ttlMs = 5 * 60 * 1000,
): DeletionPreview & { previewToken: string } {
	const expiresAt = new Date(now.getTime() + ttlMs).toISOString()
	const preview: DeletionPreview = {
		...input,
		version: data.version,
		expiresAt,
		commentCount: data.commentCount,
		media: data.media,
		cloudinaryDeletion: 'NOT_REQUESTED',
		rollback: {
			database:
				'使用数据库备份或受控逆向 migration 恢复；本 Action 不创建完整站点备份。',
			git: '使用 Git revert、branch 或 tag 恢复 Markdown/album.yaml/WebP。',
			cloudinary:
				'本 Action 不删除或恢复 Cloudinary；原始媒体和保留策略需单独维护。',
		},
	}
	return {
		...preview,
		previewToken: createDeletionPreviewToken({
			type: preview.type,
			id: preview.id,
			version: preview.version,
			expiresAt: preview.expiresAt,
		}),
	}
}
