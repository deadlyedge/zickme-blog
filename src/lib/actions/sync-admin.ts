'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { runSync } from '@/lib/sync/sync-orchestrator'
import { getSyncRun, listRecentSyncRuns } from '@/lib/sync/sync-repository'
import type { SyncScope } from '@/lib/sync/sync-types'
import { parseSyncScope } from '@/lib/sync/sync-types'

const scopeSchema = z.enum(['POSTS', 'GALLERIES', 'ALL'])
const listSchema = z
	.object({ limit: z.number().int().min(1).max(100).optional() })
	.optional()
const retrySchema = z.object({
	runId: z.uuid(),
	scope: scopeSchema,
	dryRun: z.boolean().optional(),
})
const triggerSchema = z.object({
	scope: scopeSchema,
	dryRun: z.boolean().optional(),
	deleteOld: z.boolean().optional(),
})

async function requireAdmin() {
	const session = await auth.api.getSession({ headers: await headers() })
	if (!session?.user?.id || session.user.role !== 'ADMIN')
		throw new Error('权限不足：需要管理员权限')
	return session.user.id
}

function toSafeRun(run: Awaited<ReturnType<typeof getSyncRun>>) {
	if (!run) return null
	return {
		runId: run.id,
		scope: run.scope,
		status: run.status,
		dryRun: run.dryRun,
		triggeredBy: run.triggeredBy,
		startedAt: run.startedAt.toISOString(),
		finishedAt: run.finishedAt?.toISOString() ?? null,
		exitCode: run.exitCode,
		errorCount: run.errorCount,
		conflictCount: run.conflictCount,
		retryOf: run.retryOf,
		lockExpiresAt: run.lockExpiresAt?.toISOString() ?? null,
		summary: run.summary,
	}
}

export async function listSyncRuns(input?: unknown) {
	try {
		await requireAdmin()
		const parsed = listSchema.safeParse(input)
		const runs = await listRecentSyncRuns(
			parsed.success ? parsed.data?.limit : 30,
		)
		return { success: true as const, runs: runs.map(toSafeRun) }
	} catch {
		return { success: false as const, error: '无法加载同步运行记录', runs: [] }
	}
}

export async function getSyncRunAction(runId: string) {
	try {
		await requireAdmin()
		const parsed = z.string().uuid().safeParse(runId)
		if (!parsed.success)
			return { success: false as const, error: '运行 ID 无效' }
		return {
			success: true as const,
			run: toSafeRun(await getSyncRun(parsed.data)),
		}
	} catch {
		return { success: false as const, error: '无法加载同步运行记录' }
	}
}

export async function retrySyncRun(input: unknown) {
	try {
		const actorId = await requireAdmin()
		const parsed = retrySchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '重试参数无效' }
		const previous = await getSyncRun(parsed.data.runId)
		if (!previous)
			return { success: false as const, error: '找不到原同步运行记录' }
		const scope = parseSyncScope(parsed.data.scope) as SyncScope
		const summary = await runSync({
			scope,
			dryRun: parsed.data.dryRun ?? previous.dryRun,
			triggeredBy: 'DASHBOARD',
			retryOf: previous.id,
			actorId,
		})
		return { success: true as const, summary }
	} catch (error) {
		return {
			success: false as const,
			error: error instanceof Error ? error.message : '重试同步失败',
		}
	}
}

export async function triggerSyncAction(input: unknown) {
	try {
		const actorId = await requireAdmin()
		const parsed = triggerSchema.safeParse(input)
		if (!parsed.success)
			return { success: false as const, error: '同步参数无效' }
		const summary = await runSync({
			scope: parsed.data.scope,
			dryRun: parsed.data.dryRun ?? false,
			deleteOld: parsed.data.deleteOld ?? true,
			triggeredBy: 'DASHBOARD',
			actorId,
		})
		return { success: true as const, summary }
	} catch (error) {
		return {
			success: false as const,
			error: error instanceof Error ? error.message : '启动同步失败',
		}
	}
}
