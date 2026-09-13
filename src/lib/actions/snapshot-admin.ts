'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
	countRecoverableSnapshots,
	getSnapshot,
	listSnapshots,
} from '@/lib/snapshot/snapshot-repository'
import {
	createSnapshot,
	restoreSnapshot,
} from '@/lib/snapshot/snapshot-service'

const createSchema = z.object({
	name: z.string().trim().min(1).max(120),
	description: z.string().trim().max(500).optional(),
	includeComments: z.boolean().optional(),
})
const idSchema = z.string().uuid()
const restoreSchema = z.object({
	snapshotId: idSchema,
	includeComments: z.boolean().optional(),
	confirm: z.literal(true),
})

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user?.id || session.user.role !== 'ADMIN')
		throw new Error('权限不足：需要管理员权限')
	return session.user.id
}

function toSafeSnapshot(snapshot: Awaited<ReturnType<typeof getSnapshot>>) {
	if (!snapshot) return null
	return {
		id: snapshot.id,
		name: snapshot.name,
		description: snapshot.description,
		status: snapshot.status,
		createdBy: snapshot.createdBy,
		createdAt: snapshot.createdAt.toISOString(),
		completedAt: snapshot.completedAt?.toISOString() ?? null,
		source: snapshot.source,
		schemaVersion: snapshot.schemaVersion,
		summary:
			snapshot.summary && typeof snapshot.summary === 'object'
				? (snapshot.summary as {
						totalRows?: number
						includesComments?: boolean
					})
				: null,
		payloadHash: snapshot.payloadHash,
		errorMessage: snapshot.errorMessage,
	}
}

export async function listSnapshotsAction() {
	try {
		await requireAdmin()
		return {
			success: true as const,
			snapshots: (await listSnapshots())
				.map(toSafeSnapshot)
				.filter(
					(snapshot): snapshot is NonNullable<typeof snapshot> =>
						snapshot !== null,
				),
		}
	} catch {
		return {
			success: false as const,
			error: '无法加载数据库快照',
			snapshots: [],
		}
	}
}

export async function createSnapshotAction(input: unknown) {
	try {
		const createdBy = await requireAdmin()
		const parsed = createSchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '快照参数无效' }
		const snapshot = await createSnapshot({ ...parsed.data, createdBy })
		revalidatePath('/dashboard/snapshots')
		return { success: true as const, snapshot: toSafeSnapshot(snapshot) }
	} catch (error) {
		return {
			success: false as const,
			error: error instanceof Error ? error.message : '创建快照失败',
		}
	}
}

export async function deleteSnapshotAction(snapshotId: string) {
	try {
		await requireAdmin()
		const parsed = idSchema.safeParse(snapshotId)
		if (!parsed.success)
			return { success: false as const, error: '快照 ID 无效' }
		const snapshot = await getSnapshot(parsed.data)
		if (!snapshot) return { success: false as const, error: '找不到快照' }
		if (snapshot.source === 'PRE_RESTORE')
			return { success: false as const, error: 'PRE_RESTORE 保护快照不能删除' }
		if (snapshot.status !== 'READY' && snapshot.status !== 'RESTORED')
			return { success: false as const, error: '当前快照状态不能删除' }
		if ((await countRecoverableSnapshots()) <= 1)
			return { success: false as const, error: '至少需要保留一个可恢复快照' }
		const { db } = await import('@/db')
		const { eq } = await import('drizzle-orm')
		const { siteSnapshots } = await import('@/db/schema')
		await db
			.update(siteSnapshots)
			.set({ status: 'DELETED' })
			.where(eq(siteSnapshots.id, parsed.data))
		revalidatePath('/dashboard/snapshots')
		return { success: true as const }
	} catch {
		return { success: false as const, error: '删除快照失败' }
	}
}

export async function restoreSnapshotAction(input: unknown) {
	try {
		const createdBy = await requireAdmin()
		const parsed = restoreSchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '恢复确认或参数无效' }
		const result = await restoreSnapshot({ ...parsed.data, createdBy })
		revalidatePath('/dashboard/snapshots')
		revalidatePath('/dashboard')
		revalidatePath('/posts')
		revalidatePath('/gallery')
		return { success: true as const, result }
	} catch (error) {
		return {
			success: false as const,
			error: error instanceof Error ? error.message : '恢复快照失败',
		}
	}
}
