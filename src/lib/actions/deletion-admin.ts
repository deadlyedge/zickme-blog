'use server'

import { and, count, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { db } from '@/db'
import {
	comments,
	galleries,
	galleryImageComments,
	galleryImages,
	posts,
} from '@/db/schema'
import { auth } from '@/lib/auth'
import {
	buildDeletionPreview,
	deletionConfirmationInputSchema,
	deletionPreviewInputSchema,
	verifyDeletionPreviewToken,
} from '@/lib/deletion/deletion-safety'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/deletion-admin')

async function requireAdminSession() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user?.id || session.user.role !== 'ADMIN')
		throw new Error('权限不足：需要管理员权限')
	return session
}

function invalidEntity() {
	return { success: false as const, error: '删除目标不存在或已不可用' }
}

export async function previewDeletion(input: unknown) {
	try {
		await requireAdminSession()
		const parsed = deletionPreviewInputSchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '删除预览参数无效' }
		const value = parsed.data

		if (value.type === 'post') {
			const row = await db.query.posts.findFirst({
				where: eq(posts.id, value.id),
			})
			if (!row) return invalidEntity()
			const [commentsResult] = await db
				.select({ count: count() })
				.from(comments)
				.where(eq(comments.postId, row.id))
			return {
				success: true as const,
				preview: buildDeletionPreview(value, {
					version: row.updatedAt.toISOString(),
					commentCount: Number(commentsResult?.count ?? 0),
					media: [],
				}),
			}
		}

		if (value.type === 'gallery') {
			const row = await db.query.galleries.findFirst({
				where: eq(galleries.id, value.id),
				with: { images: true },
			})
			if (!row) return invalidEntity()
			const media = row.images.map((image) => ({
				id: image.id,
				publicId: image.publicId,
				sourcePath: image.sourcePath,
			}))
			const imageIds = row.images.map((image) => image.id)
			const [commentsResult] = await db
				.select({ count: count() })
				.from(galleryImageComments)
				.where(
					imageIds.length > 0
						? inArray(galleryImageComments.galleryImageId, imageIds)
						: eq(galleryImageComments.galleryImageId, ''),
				)
			return {
				success: true as const,
				preview: buildDeletionPreview(value, {
					version: row.updatedAt.toISOString(),
					commentCount: Number(commentsResult?.count ?? 0),
					media,
				}),
			}
		}

		const row = await db.query.galleryImages.findFirst({
			where: eq(galleryImages.id, value.id),
		})
		if (!row) return invalidEntity()
		const [commentsResult] = await db
			.select({ count: count() })
			.from(galleryImageComments)
			.where(eq(galleryImageComments.galleryImageId, row.id))
		return {
			success: true as const,
			preview: buildDeletionPreview(value, {
				version: row.updatedAt.toISOString(),
				commentCount: Number(commentsResult?.count ?? 0),
				media: [
					{ id: row.id, publicId: row.publicId, sourcePath: row.sourcePath },
				],
			}),
		}
	} catch (error) {
		logger.error('删除预览失败', error)
		return { success: false as const, error: '无法生成删除预览' }
	}
}

export async function confirmDeletion(input: unknown) {
	try {
		const session = await requireAdminSession()
		const parsed = deletionConfirmationInputSchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '删除确认参数无效' }
		const value = parsed.data

		if (value.type === 'post') {
			const row = await db.query.posts.findFirst({
				where: eq(posts.id, value.id),
			})
			if (
				!row ||
				!verifyDeletionPreviewToken(value.previewToken, {
					...value,
					version: row.updatedAt.toISOString(),
				})
			)
				return {
					success: false as const,
					error: '预览已过期或实体已发生变化，请重新预览',
				}
			const updated = await db
				.update(posts)
				.set({ archivedAt: new Date(), status: 'ARCHIVED' })
				.where(and(eq(posts.id, row.id), eq(posts.updatedAt, row.updatedAt)))
				.returning({ id: posts.id })
			if (updated.length !== 1)
				return { success: false as const, error: '实体已发生变化，请重新预览' }
		}
		if (value.type === 'gallery') {
			const row = await db.query.galleries.findFirst({
				where: eq(galleries.id, value.id),
			})
			if (
				!row ||
				!verifyDeletionPreviewToken(value.previewToken, {
					...value,
					version: row.updatedAt.toISOString(),
				})
			)
				return {
					success: false as const,
					error: '预览已过期或实体已发生变化，请重新预览',
				}
			const updated = await db
				.update(galleries)
				.set({ status: 'ARCHIVED' })
				.where(
					and(eq(galleries.id, row.id), eq(galleries.updatedAt, row.updatedAt)),
				)
				.returning({ id: galleries.id })
			if (updated.length !== 1)
				return { success: false as const, error: '实体已发生变化，请重新预览' }
		}
		if (value.type === 'galleryImage') {
			const row = await db.query.galleryImages.findFirst({
				where: eq(galleryImages.id, value.id),
			})
			if (
				!row ||
				!verifyDeletionPreviewToken(value.previewToken, {
					...value,
					version: row.updatedAt.toISOString(),
				})
			)
				return {
					success: false as const,
					error: '预览已过期或实体已发生变化，请重新预览',
				}
			const updated = await db
				.update(galleryImages)
				.set({ syncStatus: 'PENDING_DELETE' })
				.where(
					and(
						eq(galleryImages.id, row.id),
						eq(galleryImages.updatedAt, row.updatedAt),
					),
				)
				.returning({ id: galleryImages.id })
			if (updated.length !== 1)
				return { success: false as const, error: '实体已发生变化，请重新预览' }
		}

		logger.warn(
			'ADMIN deletion confirmed; Cloudinary deletion was not requested',
			{
				actorId: session.user.id,
				type: value.type,
				entityId: value.id,
				cloudinary: 'NOT_REQUESTED',
			},
		)
		return { success: true as const, cloudinary: 'NOT_REQUESTED' as const }
	} catch (error) {
		logger.error('删除确认失败', error)
		return {
			success: false as const,
			error: '删除确认失败，请查看日志并人工处理',
		}
	}
}
