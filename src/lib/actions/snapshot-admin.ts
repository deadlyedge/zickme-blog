'use server'

const DISABLED_ERROR =
	'Snapshot 功能暂时停用。请使用 Git、Neon/数据库备份和 Cloudinary 原始媒体备份恢复；Snapshot 不是完整站点备份。'

export async function listSnapshotsAction() {
	return { success: false as const, error: DISABLED_ERROR, snapshots: [] }
}

export async function createSnapshotAction(input: unknown) {
	void input
	return { success: false as const, error: DISABLED_ERROR, snapshot: null }
}

export async function deleteSnapshotAction(snapshotId: string) {
	void snapshotId
	return { success: false as const, error: DISABLED_ERROR }
}

export async function restoreSnapshotAction(input: unknown) {
	void input
	return { success: false as const, error: DISABLED_ERROR }
}
