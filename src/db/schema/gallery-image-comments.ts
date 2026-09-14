import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { galleryImages } from './gallery'
import { statusTypeEnum } from './posts'

export const galleryImageComments = pgTable(
	'GalleryImageComment',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		galleryImageId: text('galleryImageId')
			.notNull()
			.references(() => galleryImages.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		status: statusTypeEnum('status').default('PUBLISHED').notNull(),
		authorId: text('authorId')
			.notNull()
			.references(() => users.id),
		parentId: text('parentId'),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		edited: boolean('edited').default(false).notNull(),
		deleted: boolean('deleted').default(false).notNull(),
	},
	(table) => [
		index('gallery_image_comment_image_idx').on(table.galleryImageId),
		index('gallery_image_comment_parent_idx').on(table.parentId),
		index('gallery_image_comment_author_idx').on(table.authorId),
		index('gallery_image_comment_status_idx').on(table.status),
	],
)

export const galleryImageCommentsRelations = relations(
	galleryImageComments,
	({ one }) => ({
		image: one(galleryImages, {
			fields: [galleryImageComments.galleryImageId],
			references: [galleryImages.id],
		}),
		author: one(users, {
			fields: [galleryImageComments.authorId],
			references: [users.id],
			relationName: 'GalleryImageCommentAuthor',
		}),
	}),
)
