'use server'

import { z } from 'zod'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireAdminSession } from '@/lib/auth/guards'
import { getSyncRun, listRecentSyncRuns } from '@/lib/sync/sync-repository'

const listSchema = z
	.object({ limit: z.number().int().min(1).max(100).optional() })
	.optional()
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
		lockExpiresAt: run.lockExpiresAt?.toISOString() ?? null,
		summary: run.summary,
	}
}

export async function listSyncRuns(
	input?: unknown,
): Promise<ActionResult<{ runs: ReturnType<typeof toSafeRun>[] }>> {
	try {
		await requireAdminSession()
		const parsed = listSchema.safeParse(input)
		const runs = await listRecentSyncRuns(
			parsed.success ? parsed.data?.limit : 30,
		)
		return actionSuccess({ runs: runs.map(toSafeRun) })
	} catch {
		return actionFailure('无法加载同步运行记录')
	}
}

export async function getSyncRunAction(
	runId: string,
): Promise<ActionResult<{ run: ReturnType<typeof toSafeRun> }>> {
	try {
		await requireAdminSession()
		const parsed = z.uuid().safeParse(runId)
		if (!parsed.success) return actionFailure('运行 ID 无效')
		return actionSuccess({ run: toSafeRun(await getSyncRun(parsed.data)) })
	} catch {
		return actionFailure('无法加载同步运行记录')
	}
}

export async function triggerSyncAction(
	input: unknown,
): Promise<ActionResult<never>> {
	void input
	return actionFailure(
		'内容源由 Git 管理，请修改 Markdown 或 album.yaml，执行 content:check 后再 publish。',
	)
}
