'use server'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { db } from '@/db'
import { comments, posts } from '@/db/schema'
import { auth } from '@/lib/auth'
import type { CommentWithReplies } from '@/types'

export type CreateCommentData = {
	content: string
	docId: string
	parentId?: string
	path: string
}

export async function createComment(data: CreateCommentData) {
	try {
		// Get current user session
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user?.id) {
			return { success: false, error: 'User not authenticated' }
		}

		// Find the post by ID
		const post = await db.query.posts.findFirst({
			where: eq(posts.id, data.docId),
		})

		if (!post) {
			return { success: false, error: 'Post not found' }
		}

		// Validate parent comment if provided
		if (data.parentId) {
			const parentComment = await db.query.comments.findFirst({
				where: and(
					eq(comments.id, data.parentId),
					eq(comments.postId, data.docId),
				),
			})

			if (!parentComment) {
				return { success: false, error: 'Parent comment not found' }
			}
		}

		// Create the comment
		const [newComment] = await db
			.insert(comments)
			.values({
				content: data.content,
				postId: data.docId,
				authorId: session.user.id,
				parentId: data.parentId || null,
				status: 'PUBLISHED',
			})
			.returning()

		revalidatePath(data.path)
		return { success: true, comment: newComment }
	} catch (error) {
		console.error('Error creating comment:', error)
		return { success: false, error: 'Failed to create comment' }
	}
}

export async function getComments(
	docId: string,
): Promise<CommentWithReplies[]> {
	try {
		// Fetch all comments for this post
		const allComments = await db.query.comments.findMany({
			where: and(
				eq(comments.postId, docId),
				inArray(comments.status, ['PUBLISHED', 'SPAM']),
			),
			with: {
				author: true,
			},
			orderBy: [asc(comments.createdAt)],
		})

		// Process comments for security and display
		const processedComments = allComments.map((c) => ({
			...c,
			content:
				c.status === 'SPAM'
					? '[此评论已被标记为垃圾信息]'
					: c.author?.banned
						? '[此用户已被封禁]'
						: c.content,
			author: {
				id: c.author.id,
				name: c.author.name,
				email: c.author.email,
				image: c.author.image,
				banned: c.author.banned,
			},
		}))

		// Build tree structure in memory
		const commentMap = new Map<string, CommentWithReplies>()
		const rootComments: CommentWithReplies[] = []

		// First pass: create all comment nodes
		processedComments.forEach((c) => {
			commentMap.set(c.id, {
				...c,
				replies: [],
			})
		})

		// Second pass: build parent-child relationships
		processedComments.forEach((c) => {
			const commentWithReplies = commentMap.get(c.id)
			if (!commentWithReplies) return

			if (c.parentId) {
				const parent = commentMap.get(c.parentId)
				if (parent?.replies) {
					parent.replies.push(commentWithReplies)
				} else {
					rootComments.push(commentWithReplies)
				}
			} else {
				rootComments.push(commentWithReplies)
			}
		})

		return rootComments
	} catch (error) {
		console.error('Error fetching comments:', error)
		return []
	}
}
