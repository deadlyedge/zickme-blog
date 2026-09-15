import type { PublicCommentAuthor } from './comment'

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
