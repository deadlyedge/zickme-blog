import type { InferSelectModel } from 'drizzle-orm'
import type { comments } from '@/db/schema'
import type { PublicCommentAuthor } from './public-comment'

export type Comment = InferSelectModel<typeof comments>

export interface CommentWithReplies extends Comment {
	replies?: CommentWithReplies[]
	depth?: number
	author: PublicCommentAuthor
}
