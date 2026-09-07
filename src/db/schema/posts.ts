import { relations } from 'drizzle-orm'
import {
	index,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core'

export const statusTypeEnum = pgEnum('StatusType', [
	'PUBLISHED',
	'DRAFT',
	'ARCHIVED',
	'PENDING',
	'SPAM',
])

export const posts = pgTable(
	'Post',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		poster: text('poster'),
		content: text('content'),
		status: statusTypeEnum('status').default('PUBLISHED').notNull(),
		sourceUrl: text('sourceUrl'),
		publishedAt: timestamp('publishedAt', { mode: 'date' }),
		archivedAt: timestamp('archivedAt', { mode: 'date' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('post_slug_idx').on(table.slug),
		index('post_published_at_idx').on(table.publishedAt),
		index('post_status_idx').on(table.status),
		index('post_archived_at_idx').on(table.archivedAt),
	],
)

export const tags = pgTable(
	'tag',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull().unique(),
		slug: text('slug').notNull().unique(),
		color: text('color'),
		background: text('background'),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('tag_slug_idx').on(table.slug)],
)

export const postsToTags = pgTable(
	'_PostToTag',
	{
		postId: text('A')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		tagId: text('B')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
	},
	(table) => [
		primaryKey({ columns: [table.postId, table.tagId] }),
		index('_PostToTag_B_index').on(table.tagId),
	],
)

export const postsRelations = relations(posts, ({ many }) => ({
	postsToTags: many(postsToTags),
	comments: many(commentsProxy),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
	postsToTags: many(postsToTags),
}))

export const postsToTagsRelations = relations(postsToTags, ({ one }) => ({
	post: one(posts, {
		fields: [postsToTags.postId],
		references: [posts.id],
	}),
	tag: one(tags, {
		fields: [postsToTags.tagId],
		references: [tags.id],
	}),
}))

// Lazy proxy for comments relation to avoid circular dependency
import { comments as commentsProxy } from './comments'
