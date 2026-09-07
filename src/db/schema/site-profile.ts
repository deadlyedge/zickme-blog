import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const siteProfile = pgTable('siteProfile', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	title: text('title').notNull(),
	bio: text('bio').notNull(),
	location: text('location'),
	email: text('email'),
	website: text('website'),
	avatar: text('avatar'),
	socialLinks: jsonb('socialLinks'),
	skills: jsonb('skills'),
	slogans: jsonb('slogans'),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})
