'use server'

import { asc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { galleries, galleryImages } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/gallery-admin')
const idSchema = z.string().min(1).max(128)
const revisionSchema = z.number().int().min(0)
const _galleryUpdateSchema = z.object({
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
const _imageUpdateSchema = z.object({
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
	void input
	return {
		success: false as const,
		error:
			'相册内容源由 Git 的 album.yaml 管理，请直接编辑文件后通过 publish 发布。',
	}
}

export async function updateGalleryImage(input: unknown) {
	void input
	return {
		success: false as const,
		error:
			'图片元数据由 Git 的 album.yaml 管理，请直接编辑文件后通过 publish 发布。',
	}
}

export async function markGalleryImageForDeletion(
	id: string,
	revision: number,
) {
	void id
	void revision
	return {
		success: false as const,
		error:
			'不能从 Dashboard 回写或删除 Git 内容源，请编辑 album.yaml 后通过 publish 发布。',
	}
}
