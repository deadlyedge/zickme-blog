'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth.server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import type { Comment } from '@/generated/prisma/client'

type CommentWithChildren = Comment & {
	children: CommentWithChildren[]
	author: {
		id: string
		name: string
		email: string
		image: string | null
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

export async function getComments(
	docId: string,
	// docType: 'posts' | 'projects',
) {
	try {
		// Find the post first to ensure it exists
		const post = await prisma.post.findFirst({
			where: {
				id: docId,
				// type: docType === 'posts' ? 'BLOG' : 'PROJECT',
			},
		})

		if (!post) {
			return []
		}

		// Fetch all comments for this post with nested children
		const comments = await prisma.comment.findMany({
			where: {
				postId: docId,
				status: 'PUBLISHED',
			},
			include: {
				author: true,
				children: {
					include: {
						author: true,
						children: {
							include: {
								author: true,
								children: {
									include: {
										author: true,
										children: {
											include: {
												author: true,
												children: {
													include: {
														author: true,
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: 'asc',
			},
		}) as CommentWithChildren[]

		// Build tree structure - only include root comments (those without parent)
		const rootComments: CommentWithReplies[] = comments
			.filter(comment => !comment.parentId)
			.map(comment => ({
				...comment,
				replies: buildRepliesTree(comment.children),
			}))

		return rootComments
	} catch (error) {
		console.error('Error fetching comments:', error)
		return []
	}
}

function buildRepliesTree(comments: CommentWithChildren[]): CommentWithReplies[] {
	return comments.map(comment => ({
		...comment,
		replies: buildRepliesTree(comment.children),
	}))
}
