import type { InferSelectModel } from 'drizzle-orm'
import type { comments } from '@/db/schema'

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

export type GalleryImageCommentStatus =
	| 'PUBLISHED'
	| 'SPAM'
	| 'DRAFT'
	| 'ARCHIVED'
	| 'PENDING'

export interface GalleryImageCommentPublic {
	id: string
	content: string
	status: GalleryImageCommentStatus
	createdAt: Date
	parentId: string | null
	author: PublicCommentAuthor
	replies: GalleryImageCommentPublic[]
}
