'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import { Comment, Post, Project } from '@/payload-types'

export interface CommentWithReplies extends Comment {
	replies?: CommentWithReplies[]
	depth?: number
}

export type CreateCommentData = {
	content: string
	docId: number
	docType: 'posts' | 'projects'
	parentId?: number
	authorName?: string
	authorEmail?: string
	path: string
}

export async function createComment(data: CreateCommentData) {
	const payload = await getPayload({ config })

	try {
		const commentData: {
			content: string
			doc: {
				relationTo: 'posts' | 'projects'
				value: number
			}
			author: {
				name?: string
				email?: string
			}
			status: 'published' | 'pending' | 'spam'
			parent?: number | null
		} = {
			content: data.content,
			doc: {
				relationTo: data.docType,
				value: data.docId,
			},
			author: {
				name: data.authorName,
				email: data.authorEmail,
			},
			status: 'published', // Default to published for now
		}

		// Only set parent if parentId is provided and valid
		if (data.parentId && data.parentId > 0) {
			// Verify that the parent comment exists and prevent circular references
			try {
				const parentComment = await payload.findByID({
					collection: 'comments',
					id: data.parentId,
				})

				// Additional validation: ensure parent comment belongs to the same document
				const parentDocRelationTo = parentComment.doc.relationTo
				const parentDocValue =
					typeof parentComment.doc.value === 'object'
						? parentComment.doc.value.id
						: parentComment.doc.value

				if (
					parentDocRelationTo !== data.docType ||
					parentDocValue !== data.docId
				) {
					return {
						success: false,
						error: 'Parent comment does not belong to the same document',
					}
				}

				commentData.parent = data.parentId
			} catch (error) {
				return { success: false, error: 'Parent comment not found' }
			}
		} else {
			commentData.parent = null
		}

		const comment = await payload.create({
			collection: 'comments',
			data: commentData,
		})

		revalidatePath(data.path)
		return { success: true, comment }
	} catch (error) {
		console.error('Error creating comment:', error)
		return { success: false, error: 'Failed to create comment' }
	}
}

export async function getComments(
	docId: number,
	docType: 'posts' | 'projects',
) {
	const payload = await getPayload({ config })

	try {
		// Fetch all comments for this document
		const { docs } = await payload.find({
			collection: 'comments',
			where: {
				'doc.value': {
					equals: docId,
				},
				'doc.relationTo': {
					equals: docType,
				},
				status: {
					equals: 'published',
				},
			},
			sort: 'createdAt',
			depth: 1,
			limit: 1000, // Reasonable limit for single load
		})

		// Build tree structure in memory
		const commentMap = new Map<number, CommentWithReplies>()
		const rootComments: CommentWithReplies[] = []

		// First pass: create nodes
		docs.forEach((doc) => {
			// Explicitly cast doc to CommentWithReplies to handle the replies property
			const node = doc as unknown as CommentWithReplies
			node.replies = []
			commentMap.set(doc.id, node)
		})

		// Second pass: link parents
		docs.forEach((docRaw) => {
			const doc = docRaw as unknown as Comment
			const node = commentMap.get(doc.id)!

			let parentId: number | undefined

			if (doc.parent && typeof doc.parent === 'object' && 'id' in doc.parent) {
				parentId = doc.parent.id
			} else if (typeof doc.parent === 'number') {
				parentId = doc.parent
			}

			if (parentId) {
				const parent = commentMap.get(parentId)
				if (parent) {
					parent.replies = parent.replies || []
					parent.replies.push(node)
				} else {
					// Orphan or root
					rootComments.push(node)
				}
			} else {
				rootComments.push(node)
			}
		})

		return rootComments
	} catch (error) {
		console.error('Error fetching comments:', error)
		return []
	}
}
