import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const siteSnapshotStatusEnum = pgEnum('SiteSnapshotStatus', [
	'CREATING',
	'READY',
	'RESTORING',
	'RESTORED',
	'FAILED',
	'DELETED',
])

export const siteSnapshotSourceEnum = pgEnum('SiteSnapshotSource', [
	'MANUAL',
	'PRE_RESTORE',
	'DEPLOYMENT',
])

/**
 * Runtime database snapshots. The payload intentionally contains only the
 * allow-listed business tables; authentication, sync history, locks and
 * binary media are never part of a snapshot.
 */
export const siteSnapshots = pgTable(
	'SiteSnapshot',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull(),
		description: text('description'),
		status: siteSnapshotStatusEnum('status').notNull().default('CREATING'),
		createdBy: text('createdBy').notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		completedAt: timestamp('completedAt', { mode: 'date' }),
		source: siteSnapshotSourceEnum('source').notNull().default('MANUAL'),
		schemaVersion: integer('schemaVersion').notNull().default(1),
		summary: jsonb('summary'),
		payload: jsonb('payload'),
		payloadHash: text('payloadHash'),
		errorMessage: text('errorMessage'),
	},
	(table) => [
		index('site_snapshot_status_idx').on(table.status),
		index('site_snapshot_created_at_idx').on(table.createdAt),
		index('site_snapshot_source_idx').on(table.source),
	],
)
