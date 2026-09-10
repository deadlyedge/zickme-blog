'use server'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { db } from '@/db'
import { comments, posts } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getPublicUserName } from '@/lib/public-user'
import type { CommentWithReplies } from '@/types'
import { formatZodError } from './types'

const createCommentSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, '评论内容不能为空')
		.max(2000, '评论内容不能超过2000字'),
	docId: z.string().min(1, '文章ID不能为空').max(128),
	parentId: z.string().min(1).max(128).optional(),
	path: z.string().min(1, '页面路径不能为空'),
})

const getCommentsSchema = z.string().min(1, '文章ID不能为空').max(128)

export type CreateCommentData = z.infer<typeof createCommentSchema>

export async function createComment(data: CreateCommentData) {
	try {
		const parsed = createCommentSchema.safeParse(data)
		if (!parsed.success) {
			return { success: false, error: formatZodError(parsed.error) }
		}

		// Get current user session
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user?.id) {
			return { success: false, error: '用户未登录' }
		}

		// Find the post by ID
		const post = await db.query.posts.findFirst({
			where: eq(posts.id, parsed.data.docId),
		})

		if (!post) {
			return { success: false, error: '文章不存在' }
		}

		// Validate parent comment if provided
		if (parsed.data.parentId) {
			const parentComment = await db.query.comments.findFirst({
				where: and(
					eq(comments.id, parsed.data.parentId),
					eq(comments.postId, parsed.data.docId),
				),
			})

			if (!parentComment) {
				return { success: false, error: '引用的父评论不存在' }
			}
		}

		// Create the comment
		const [newComment] = await db
			.insert(comments)
			.values({
				content: parsed.data.content,
				postId: parsed.data.docId,
				authorId: session.user.id,
				parentId: parsed.data.parentId || null,
				status: 'PUBLISHED',
			})
			.returning()

		revalidatePath(parsed.data.path)
		return { success: true, comment: newComment }
	} catch (error) {
		console.error('Error creating comment:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : '发表评论失败',
		}
	}
}

export async function getComments(
	docId: string,
): Promise<CommentWithReplies[]> {
	try {
		const parsed = getCommentsSchema.safeParse(docId)
		if (!parsed.success) {
			return []
		}

		// Fetch all comments for this post
		const allComments = await db.query.comments.findMany({
			where: and(
				eq(comments.postId, parsed.data),
				inArray(comments.status, ['PUBLISHED', 'SPAM']),
			),
			with: {
				author: {
					columns: {
						id: true,
						name: true,
						email: true,
						image: true,
						banned: true,
					},
				},
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
				displayName: getPublicUserName(c.author.name, c.author.email),
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
