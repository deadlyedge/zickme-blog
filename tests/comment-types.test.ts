import { describe, expect, test } from 'bun:test'
import type { CommentWithReplies, PublicCommentAuthor } from '../src/types'
import type { PublicCommentAuthor as DomainPublicCommentAuthor } from '../src/types/comment/comment'

describe('comment type boundaries', () => {
	test('public author type is available from the domain and root exports', () => {
		const author: DomainPublicCommentAuthor = {
			id: 'user-1',
			displayName: 'Alice',
			image: null,
			banned: false,
		}
		const rootAuthor: PublicCommentAuthor = author

		expect(rootAuthor.displayName).toBe('Alice')
	})

	test('CommentWithReplies keeps the public author and recursive replies shape', () => {
		const comment = {
			id: 'comment-1',
			postId: 'post-1',
			content: 'Hello',
			status: 'PUBLISHED' as const,
			edited: false,
			createdAt: new Date(),
			authorId: 'user-1',
			parentId: null,
			editedAt: null,
			editedBy: null,
			deleted: false,
			deletedBy: null,
			author: {
				id: 'user-1',
				displayName: 'Alice',
				image: null,
				banned: false,
			},
			replies: [],
		} satisfies CommentWithReplies

		expect(comment.replies).toHaveLength(0)
	})
})
