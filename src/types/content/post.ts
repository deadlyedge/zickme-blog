import type { InferSelectModel } from 'drizzle-orm'
import type { posts } from '@/db/schema'

export type StatusType = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'PENDING' | 'SPAM'

export type Post = InferSelectModel<typeof posts>

export type PostWithTags = Post & {
	tags?:
		| {
				id: string
				name: string
				slug: string
				color: string | null
		  }[]
		| null
}

export function isPostWithTags(post: unknown): post is PostWithTags {
	return (
		post !== null &&
		typeof post === 'object' &&
		'id' in post &&
		typeof (post as Record<string, unknown>).id === 'string' &&
		'title' in post &&
		typeof (post as Record<string, unknown>).title === 'string'
	)
}
