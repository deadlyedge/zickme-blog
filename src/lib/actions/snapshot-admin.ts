'use server'

import { type ActionResult, actionFailure } from '@/lib/actions/action-result'

const DISABLED_ERROR =
	'Snapshot 功能暂时停用。请使用 Git、Neon/数据库备份和 Cloudinary 原始媒体备份恢复；Snapshot 不是完整站点备份。'

export async function listSnapshotsAction(): Promise<
	ActionResult<{ snapshots: never[] }>
> {
	return actionFailure(DISABLED_ERROR)
}

export async function createSnapshotAction(
	input: unknown,
): Promise<ActionResult<{ snapshot: never }>> {
	void input
	return actionFailure(DISABLED_ERROR)
}

export async function deleteSnapshotAction(
	snapshotId: string,
): Promise<ActionResult<null>> {
	void snapshotId
	return actionFailure(DISABLED_ERROR)
}

export async function restoreSnapshotAction(
	input: unknown,
): Promise<ActionResult<null>> {
	void input
	return actionFailure(DISABLED_ERROR)
}
