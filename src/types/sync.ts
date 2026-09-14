import type { InferSelectModel } from 'drizzle-orm'
import type { syncLogs } from '@/db/schema'

export type Role = 'ADMIN' | 'EDITOR' | 'USER'
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'
export type SyncLog = InferSelectModel<typeof syncLogs>

export interface SyncLogItem {
	stage: 'frontmatter' | 'media' | 'db' | 'general'
	level: 'info' | 'warn' | 'error' | 'success'
	message: string
	detail?: string
	timestamp: string
}

export interface SyncResult {
	success: boolean
	status: SyncStatus
	totalPosts: number
	successCount: number
	errorCount: number
	logs: SyncLogItem[]
	sourceMissing?: string[]
}
