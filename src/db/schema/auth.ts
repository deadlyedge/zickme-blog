import { relations } from 'drizzle-orm'
import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { comments } from './comments'

export const roleEnum = pgEnum('Role', ['ADMIN', 'EDITOR', 'USER'])

export const users = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').default(false).notNull(),
	image: text('image'),
	banned: boolean('banned').default(false).notNull(),
	role: roleEnum('role').default('USER').notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})

export const sessions = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('account', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { mode: 'date' }),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { mode: 'date' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})

export const verifications = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
	comments: many(comments, { relationName: 'CommentAuthor' }),
	editedComments: many(comments, { relationName: 'CommentEditedBy' }),
	deletedComments: many(comments, { relationName: 'CommentDeletedBy' }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}))
