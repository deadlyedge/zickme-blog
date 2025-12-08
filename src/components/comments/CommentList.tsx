import { type CommentWithReplies } from '@/lib/actions/comments'
import { CommentItem } from './CommentItem'

interface CommentListProps {
	comments: CommentWithReplies[]
	docId: string
	depth?: number
}

export function CommentList({
	comments,
	docId,
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
					depth={depth}
				/>
			))}
		</div>
	)
}
