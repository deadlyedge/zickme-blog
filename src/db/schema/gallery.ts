import { relations } from 'drizzle-orm'
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from 'drizzle-orm/pg-core'

export const galleryStatusEnum = pgEnum('GalleryStatus', [
	'PUBLISHED',
	'DRAFT',
	'ARCHIVED',
])

export const galleryImageSyncStatusEnum = pgEnum('GalleryImageSyncStatus', [
	'LOCAL_ONLY',
	'REMOTE_ONLY',
	'CONFLICT',
	'IN_SYNC',
	'PENDING_DELETE',
])

export const galleries = pgTable(
	'Gallery',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		slug: text('slug').notNull().unique(),
		title: text('title').notNull(),
		description: text('description'),
		cover: text('cover'),
		status: galleryStatusEnum('status').default('DRAFT').notNull(),
		publishedAt: timestamp('publishedAt', { mode: 'date' }),
		sourcePath: text('sourcePath').notNull(),
		metadata: jsonb('metadata'),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('gallery_status_idx').on(table.status)],
)

export const galleryImages = pgTable(
	'GalleryImage',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		galleryId: text('galleryId')
			.notNull()
			.references(() => galleries.id, { onDelete: 'cascade' }),
		sourcePath: text('sourcePath').notNull(),
		publicId: text('publicId'),
		url: text('url'),
		thumbnailUrl: text('thumbnailUrl'),
		title: text('title'),
		description: text('description'),
		alt: text('alt'),
		sortOrder: integer('sortOrder').notNull().default(0),
		hidden: boolean('hidden').notNull().default(false),
		width: integer('width'),
		height: integer('height'),
		exif: jsonb('exif'),
		fileHash: text('fileHash'),
		fileSize: integer('fileSize'),
		sourceModifiedAt: timestamp('sourceModifiedAt', { mode: 'date' }),
		lastSyncedAt: timestamp('lastSyncedAt', { mode: 'date' }),
		syncVersion: integer('syncVersion').notNull().default(0),
		revision: integer('revision').notNull().default(0),
		syncStatus: galleryImageSyncStatusEnum('syncStatus')
			.notNull()
			.default('LOCAL_ONLY'),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		unique('gallery_image_gallery_source_unique').on(
			table.galleryId,
			table.sourcePath,
		),
		unique('gallery_image_gallery_order_unique').on(
			table.galleryId,
			table.sortOrder,
		),
		index('gallery_image_gallery_idx').on(table.galleryId),
	],
)

export const galleriesRelations = relations(galleries, ({ many }) => ({
	images: many(galleryImages),
}))

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
	gallery: one(galleries, {
		fields: [galleryImages.galleryId],
		references: [galleries.id],
	}),
}))
