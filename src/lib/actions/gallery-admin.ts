'use server'

import { and, asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/gallery-admin')
const idSchema = z.string().min(1).max(128)
const revisionSchema = z.number().int().min(0)
const galleryUpdateSchema = z.object({
	id: idSchema,
	revision: revisionSchema,
	title: z.string().trim().min(1).max(200),
	description: z.string().max(5000).nullable(),
	cover: z.string().max(500).nullable(),
	status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
	tags: z.array(z.string().trim().min(1).max(80)).max(50),
	location: z.string().max(200),
	showExif: z.boolean(),
	showLocation: z.boolean(),
})
const imageUpdateSchema = z.object({
	id: idSchema,
	revision: revisionSchema,
	title: z.string().max(200).nullable(),
	description: z.string().max(5000).nullable(),
	alt: z.string().max(300).nullable(),
	sortOrder: z.number().int().min(0).max(100000),
	hidden: z.boolean(),
})

async function requireAdminSession() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user?.id || session.user.role !== 'ADMIN')
		throw new Error('权限不足：需要管理员权限')
}

export async function getDashboardGalleries() {
	try {
		await requireAdminSession()
		return await db.query.galleries.findMany({
			with: { images: { orderBy: [asc(galleryImages.sortOrder)] } },
			orderBy: [asc(galleries.slug)],
		})
	} catch (error) {
		logger.error('Failed to load Gallery dashboard', error)
		return {
			success: false as const,
			error: '无法加载 Gallery 管理数据',
			galleries: [],
		}
	}
}

export async function updateGallery(input: unknown) {
	try {
		await requireAdminSession()
		const parsed = galleryUpdateSchema.safeParse(input)
		if (!parsed.success)
			return {
				success: false,
				error: parsed.error.issues[0]?.message ?? '参数错误',
			}
		const { id, revision, ...data } = parsed.data
		const metadata = {
			tags: data.tags,
			location: data.location,
			showExif: data.showExif,
			showLocation: data.showLocation,
		}
		const result = await db
			.update(galleries)
			.set({
				title: data.title,
				description: data.description,
				cover: data.cover,
				status: data.status,
				metadata,
				revision: sql`${galleries.revision} + 1`,
				syncStatus: 'REMOTE_ONLY',
			})
			.where(and(eq(galleries.id, id), eq(galleries.revision, revision)))
			.returning({ revision: galleries.revision })
		if (!result[0])
			return {
				success: false,
				error: '相册已被其他操作修改，请刷新后重试',
				conflict: true,
			}
		revalidatePath('/dashboard/gallery')
		revalidatePath('/gallery')
		return { success: true, revision: result[0].revision }
	} catch (error) {
		logger.error('Failed to update Gallery', error)
		return { success: false, error: '保存相册失败' }
	}
}

export async function updateGalleryImage(input: unknown) {
	try {
		await requireAdminSession()
		const parsed = imageUpdateSchema.safeParse(input)
		if (!parsed.success)
			return {
				success: false,
				error: parsed.error.issues[0]?.message ?? '参数错误',
			}
		const { id, revision, ...data } = parsed.data
		const result = await db
			.update(galleryImages)
			.set({
				...data,
				revision: sql`${galleryImages.revision} + 1`,
				syncStatus: 'REMOTE_ONLY',
			})
			.where(
				and(eq(galleryImages.id, id), eq(galleryImages.revision, revision)),
			)
			.returning({ revision: galleryImages.revision })
		if (!result[0])
			return {
				success: false,
				error: '图片已被其他操作修改，请刷新后重试',
				conflict: true,
			}
		revalidatePath('/dashboard/gallery')
		revalidatePath('/gallery')
		return { success: true, revision: result[0].revision }
	} catch (error) {
		logger.error('Failed to update Gallery image', error)
		return { success: false, error: '保存图片失败' }
	}
}

export async function markGalleryImageForDeletion(
	id: string,
	revision: number,
) {
	try {
		await requireAdminSession()
		const parsed = z
			.object({ id: idSchema, revision: revisionSchema })
			.safeParse({ id, revision })
		if (!parsed.success) return { success: false, error: '参数错误' }
		const result = await db
			.update(galleryImages)
			.set({
				syncStatus: 'PENDING_DELETE',
				revision: sql`${galleryImages.revision} + 1`,
			})
			.where(
				and(eq(galleryImages.id, id), eq(galleryImages.revision, revision)),
			)
			.returning({ revision: galleryImages.revision })
		if (!result[0])
			return {
				success: false,
				error: '图片已被其他操作修改，请刷新后重试',
				conflict: true,
			}
		revalidatePath('/dashboard/gallery')
		return { success: true, revision: result[0].revision }
	} catch (error) {
		logger.error('Failed to mark Gallery image deletion', error)
		return { success: false, error: '标记删除失败' }
	}
}
