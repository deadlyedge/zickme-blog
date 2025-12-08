'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import type { Comment } from '@/generated/prisma/client'

type CommentWithAuthor = Comment & {
	author: {
		id: string
		name: string
		email: string
		image: string | null
		banned: boolean
	}
}

export interface CommentWithReplies extends Comment {
	replies?: CommentWithReplies[]
	depth?: number
	author: {
		id: string
		name: string
		email: string
		image: string | null
		banned: boolean
	}
}

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

		// Find the post by ID and type
		const post = await prisma.post.findFirst({
			where: {
				id: data.docId,
				// type: data.docType === 'posts' ? 'BLOG' : 'PROJECT',
			},
		})

		if (!post) {
			return { success: false, error: 'Post not found' }
		}

		// Validate parent comment if provided
		let parentComment = null
		if (data.parentId) {
			parentComment = await prisma.comment.findFirst({
				where: {
					id: data.parentId,
					postId: data.docId,
				},
			})

			if (!parentComment) {
				return { success: false, error: 'Parent comment not found' }
			}
		}

		// Create the comment
		const comment = await prisma.comment.create({
			data: {
				content: data.content,
				postId: data.docId,
				authorId: session.user.id,
				parentId: data.parentId || null,
				status: 'PUBLISHED',
			},
			include: {
				author: true,
				parent: true,
			},
		})

		revalidatePath(data.path)
		return { success: true, comment }
	} catch (error) {
		console.error('Error creating comment:', error)
		return { success: false, error: 'Failed to create comment' }
	}
}

export async function getComments(docId: string) {
	try {
		// Find the post first to ensure it exists
		const post = await prisma.post.findFirst({
			where: {
				id: docId,
			},
		})

		if (!post) {
			return []
		}

		// Fetch all comments for this post in a single query
		const allComments = await prisma.comment.findMany({
			where: {
				postId: docId,
				status: 'PUBLISHED',
			},
			include: {
				author: true,
			},
			orderBy: {
				createdAt: 'asc',
			},
		}) as CommentWithAuthor[]

		// Build tree structure in memory
		const commentMap = new Map<string, CommentWithReplies>()
		const rootComments: CommentWithReplies[] = []

		// First pass: create all comment nodes
		allComments.forEach(comment => {
			commentMap.set(comment.id, {
				...comment,
				replies: [],
			})
		})

		// Second pass: build parent-child relationships
		allComments.forEach(comment => {
			const commentWithReplies = commentMap.get(comment.id)!

			if (comment.parentId) {
				const parent = commentMap.get(comment.parentId)
				if (parent && parent.replies) {
					parent.replies.push(commentWithReplies)
				} else {
					// Orphan comment (parent doesn't exist), treat as root
					rootComments.push(commentWithReplies)
				}
			} else {
				// Root comment
				rootComments.push(commentWithReplies)
			}
		})

		return rootComments
	} catch (error) {
		console.error('Error fetching comments:', error)
		return []
	}
}
