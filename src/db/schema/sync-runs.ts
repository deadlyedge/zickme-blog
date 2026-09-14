import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core'

export const syncRuns = pgTable(
	'SyncRun',
	{
		id: text('id').primaryKey(),
		protocolVersion: integer('protocolVersion').notNull().default(1),
		scope: text('scope').notNull(),
		status: text('status').notNull(),
		dryRun: boolean('dryRun').notNull().default(false),
		triggeredBy: text('triggeredBy').notNull(),
		actorId: text('actorId'),
		startedAt: timestamp('startedAt', { mode: 'date' }).notNull(),
		finishedAt: timestamp('finishedAt', { mode: 'date' }),
		exitCode: integer('exitCode'),
		summary: jsonb('summary'),
		errorCount: integer('errorCount').notNull().default(0),
		conflictCount: integer('conflictCount').notNull().default(0),
		lockKey: text('lockKey'),
		lockExpiresAt: timestamp('lockExpiresAt', { mode: 'date' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		unique('sync_run_lock_unique').on(table.lockKey),
		index('sync_run_scope_idx').on(table.scope),
		index('sync_run_status_idx').on(table.status),
		index('sync_run_created_at_idx').on(table.createdAt),
		index('sync_run_lock_idx').on(table.lockKey, table.lockExpiresAt),
	],
)
