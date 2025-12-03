import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { CommentsSectionClient } from './CommentsSectionClient'
import { getComments } from '@/lib/actions/comments'

interface CommentsSectionProps {
	docId: number
	docType: 'posts' | 'projects'
}

export async function CommentsSection({ docId, docType }: CommentsSectionProps) {
	const queryClient = getQueryClient()

	// Prefetch comments data
	await queryClient.prefetchQuery({
		queryKey: ['comments', docType, docId],
		queryFn: () => getComments(docId, docType),
		staleTime: 2 * 60 * 1000, // 2 minutes
	})

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<CommentsSectionClient docId={docId} docType={docType} />
		</HydrationBoundary>
	)
}
