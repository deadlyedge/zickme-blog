import type { InferSelectModel } from 'drizzle-orm'
import type { comments } from '@/db/schema'
// import type { PublicCommentAuthor } from './public-comment'

export type Comment = InferSelectModel<typeof comments>

export interface PublicCommentAuthor {
	id: string
	displayName: string
	image: string | null
	banned: boolean
}

export interface CommentWithReplies extends Comment {
	replies?: CommentWithReplies[]
	depth?: number
	author: PublicCommentAuthor
}
