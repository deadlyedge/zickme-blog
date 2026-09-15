export interface UserCommentItem {
	id: string
	content: string
	status: string
	createdAt: Date
	postId: string
	postTitle: string
	postSlug: string
	parentCommentId?: string | null
	parentAuthorName?: string | null
}

export interface UserReplyItem {
	id: string
	content: string
	createdAt: Date
	status: string
	postId: string
	postTitle: string
	postSlug: string
	replyAuthor: {
		id: string
		name: string
		image?: string | null
	}
	originalCommentContent: string
}

export interface UserPortalData {
	user: {
		id: string
		name: string
		email: string
		image?: string | null
		role: string
		createdAt: Date
	}
	comments: UserCommentItem[]
	repliesToMe: UserReplyItem[]
}
