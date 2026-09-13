export type SyncErrorCode =
	| 'INVALID_INPUT'
	| 'LOCKED'
	| 'DATABASE_UNAVAILABLE'
	| 'MIGRATION_REQUIRED'
	| 'CONTENT_INVALID'
	| 'SLUG_CONFLICT'
	| 'REVISION_CONFLICT'
	| 'MERGE_CONFLICT'
	| 'UNSUPPORTED_MEDIA'
	| 'CLOUDINARY_UNAVAILABLE'
	| 'CLOUDINARY_UPLOAD_FAILED'
	| 'PENDING_DELETE_CONFIRMATION'
	| 'WRITEBACK_CONFLICT'

export class SyncError extends Error {
	readonly code: SyncErrorCode

	constructor(code: SyncErrorCode, message: string) {
		super(message)
		this.name = 'SyncError'
		this.code = code
	}
}

export function safeSyncError(error: unknown): {
	code: SyncErrorCode
	message: string
} {
	if (error instanceof SyncError)
		return { code: error.code, message: error.message }
	return {
		code: 'DATABASE_UNAVAILABLE',
		message:
			error instanceof Error
				? error.message
				: '同步失败，请检查数据库和运行环境',
	}
}
