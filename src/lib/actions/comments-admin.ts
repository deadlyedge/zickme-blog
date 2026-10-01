'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { COMMENT_MESSAGES } from '@/constants/comments'
import { POST_RULES } from '@/constants/post'
import { db } from '@/db'
import { comments } from '@/db/schema'
import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireAdminSession } from '@/lib/auth/guards'
import { createLogger } from '@/lib/logger'
import { formatZodError } from './zodError'

const logger = createLogger('actions/dashboard')

const toggleCommentSpamSchema = z.object({
	commentId: z
		.string()
		.min(1, COMMENT_MESSAGES.idRequired)
		.max(POST_RULES.idMaxLength),
	isSpam: z.boolean(),
})

const deleteCommentSchema = z
	.string()
	.min(1, COMMENT_MESSAGES.idRequired)
	.max(POST_RULES.idMaxLength)

/** 切换评论垃圾/正常状态。 */
export async function toggleCommentSpam(
	commentId: string,
	isSpam: boolean,
): Promise<ActionResult<null>> {
	try {
		await requireAdminSession()

		const parsed = toggleCommentSpamSchema.safeParse({ commentId, isSpam })
		if (!parsed.success) {
			return actionFailure(formatZodError(parsed.error))
		}

		await db
			.update(comments)
			.set({
				status: parsed.data.isSpam ? 'SPAM' : 'PUBLISHED',
			})
			.where(eq(comments.id, parsed.data.commentId))

		revalidatePath('/dashboard/users')
		revalidatePath('/dashboard')
		return actionSuccess(null)
	} catch (error) {
		logger.error('Toggle comment spam error', error)
		return actionFailure(error instanceof Error ? error.message : '操作失败')
	}
}

/** 删除指定评论。 */
export async function deleteComment(
	commentId: string,
): Promise<ActionResult<null>> {
	try {
		await requireAdminSession()

		const parsed = deleteCommentSchema.safeParse(commentId)
		if (!parsed.success) {
			return actionFailure(formatZodError(parsed.error))
		}

		await db.delete(comments).where(eq(comments.id, parsed.data))

		revalidatePath('/dashboard/users')
		revalidatePath('/dashboard')
		return actionSuccess(null)
	} catch (error) {
		logger.error('Delete comment error', error)
		return actionFailure(error instanceof Error ? error.message : '操作失败')
	}
}
