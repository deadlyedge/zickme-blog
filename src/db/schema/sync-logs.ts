import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const syncStatusEnum = pgEnum('SyncStatus', [
	'SUCCESS',
	'FAILED',
	'PARTIAL',
])

export const syncLogs = pgTable('SyncLog', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	triggerType: text('triggerType').notNull().default('MANUAL'), // MANUAL, UPLOAD, CLI, ACTION
	status: syncStatusEnum('status').notNull().default('SUCCESS'),
	totalPosts: text('totalPosts').default('0'),
	successCount: text('successCount').default('0'),
	errorCount: text('errorCount').default('0'),
	logs: jsonb('logs').$type<
		Array<{
			stage: 'frontmatter' | 'media' | 'db' | 'general'
			level: 'info' | 'warn' | 'error' | 'success'
			message: string
			detail?: string
			timestamp: string
		}>
	>(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
})
