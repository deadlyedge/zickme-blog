import type { CommentWithReplies } from '@/lib/actions/comments'
import { CommentItem } from './CommentItem'

interface CommentListProps {
	comments: CommentWithReplies[]
	docId: string
	currentUser?: {
		id: string
		name?: string | null
		email?: string
		role?: string
		image?: string | null
	}
	depth?: number
}

export function CommentList({
	comments,
	docId,
	currentUser,
	depth = 0,
}: CommentListProps) {
	if (!comments || comments.length === 0) return null

	return (
		<div className={`flex flex-col gap-6 ${depth > 0 ? 'mt-6' : ''}`}>
			{comments.map((comment) => (
				<CommentItem
					key={comment.id}
					comment={comment}
					docId={docId}
					currentUser={currentUser}
					depth={depth}
				/>
			))}
		</div>
	)
}
