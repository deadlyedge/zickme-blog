import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { posts, statusTypeEnum } from './posts'

export const comments = pgTable(
	'Comment',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		postId: text('postId')
			.notNull()
			.references(() => posts.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		status: statusTypeEnum('status').default('PUBLISHED').notNull(),
		edited: boolean('edited').default(false).notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		authorId: text('authorId')
			.notNull()
			.references(() => users.id),
		parentId: text('parentId'),
		editedAt: timestamp('editedAt', { mode: 'date' }),
		editedBy: text('editedBy').references(() => users.id),
		deleted: boolean('deleted').default(false).notNull(),
		deletedBy: text('deletedBy').references(() => users.id),
	},
	(table) => [
		index('comment_post_id_idx').on(table.postId),
		index('comment_status_idx').on(table.status),
		index('comment_parent_id_idx').on(table.parentId),
		index('comment_author_id_idx').on(table.authorId),
	],
)

export const commentsRelations = relations(comments, ({ one, many }) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id],
	}),
	author: one(users, {
		fields: [comments.authorId],
		references: [users.id],
		relationName: 'CommentAuthor',
	}),
	parent: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: 'CommentThread',
	}),
	children: many(comments, {
		relationName: 'CommentThread',
	}),
	editedByUser: one(users, {
		fields: [comments.editedBy],
		references: [users.id],
		relationName: 'CommentEditedBy',
	}),
	deletedByUser: one(users, {
		fields: [comments.deletedBy],
		references: [users.id],
		relationName: 'CommentDeletedBy',
	}),
}))
