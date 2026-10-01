'use server'

import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { GALLERY_RULES } from '@/constants/gallery'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireAdminSession } from '@/lib/auth/guards'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/gallery-admin')
const idSchema = z.string().min(1).max(GALLERY_RULES.idMaxLength)
const revisionSchema = z.number().int().min(0)
const _galleryUpdateSchema = z.object({
	id: idSchema,
	revision: revisionSchema,
	title: z
		.string()
		.trim()
		.min(GALLERY_RULES.title.minLength)
		.max(GALLERY_RULES.title.maxLength),
	description: z.string().max(GALLERY_RULES.descriptionMaxLength).nullable(),
	cover: z.string().max(GALLERY_RULES.coverMaxLength).nullable(),
	status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']),
	tags: z
		.array(
			z
				.string()
				.trim()
				.min(GALLERY_RULES.tag.minLength)
				.max(GALLERY_RULES.tag.maxLength),
		)
		.max(GALLERY_RULES.maxTags),
	location: z.string().max(GALLERY_RULES.locationMaxLength),
	showExif: z.boolean(),
	showLocation: z.boolean(),
})
const _imageUpdateSchema = z.object({
	id: idSchema,
	revision: revisionSchema,
	title: z.string().max(GALLERY_RULES.title.maxLength).nullable(),
	description: z.string().max(GALLERY_RULES.descriptionMaxLength).nullable(),
	alt: z.string().max(GALLERY_RULES.altMaxLength).nullable(),
	sortOrder: z
		.number()
		.int()
		.min(GALLERY_RULES.sortOrder.min)
		.max(GALLERY_RULES.sortOrder.max),
	hidden: z.boolean(),
})

export async function getDashboardGalleries(): Promise<
	ActionResult<Awaited<ReturnType<typeof db.query.galleries.findMany>>>
> {
	try {
		await requireAdminSession()
		return actionSuccess(
			await db.query.galleries.findMany({
				with: { images: { orderBy: [asc(galleryImages.sortOrder)] } },
				orderBy: [asc(galleries.slug)],
			}),
		)
	} catch (error) {
		logger.error('Failed to load Gallery dashboard', error)
		return actionFailure('无法加载 Gallery 管理数据')
	}
}

export async function updateGallery(
	input: unknown,
): Promise<ActionResult<never>> {
	void input
	return actionFailure(
		'相册内容源由 Git 的 album.yaml 管理，请直接编辑文件后通过 publish 发布。',
	)
}

export async function updateGalleryImage(
	input: unknown,
): Promise<ActionResult<never>> {
	void input
	return actionFailure(
		'图片元数据由 Git 的 album.yaml 管理，请直接编辑文件后通过 publish 发布。',
	)
}

export async function markGalleryImageForDeletion(
	id: string,
): Promise<ActionResult<never>> {
	void id
	return actionFailure(
		'不能从 Dashboard 回写或删除 Git 内容源，请编辑 album.yaml 后通过 publish 发布。',
	)
}
