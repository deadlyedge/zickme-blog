'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getSyncRun, listRecentSyncRuns } from '@/lib/sync/sync-repository'

const listSchema = z
	.object({ limit: z.number().int().min(1).max(100).optional() })
	.optional()
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

export async function triggerSyncAction(input: unknown) {
	void input
	return {
		success: false as const,
		error:
			'内容源由 Git 管理，请修改 Markdown 或 album.yaml，执行 content:check 后再 publish。',
	}
}
