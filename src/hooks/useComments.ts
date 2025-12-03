import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CommentWithReplies, CreateCommentData } from '@/lib/actions/comments'

const fetchComments = async (docId: number, docType: 'posts' | 'projects'): Promise<CommentWithReplies[]> => {
	const response = await fetch(`/api/comments?docId=${docId}&docType=${docType}`)
	if (!response.ok) {
		throw new Error('Failed to fetch comments')
	}
	return response.json()
}

export const useComments = (docId: number, docType: 'posts' | 'projects') => {
	return useQuery({
		queryKey: ['comments', docType, docId],
		queryFn: () => fetchComments(docId, docType),
		staleTime: 2 * 60 * 1000, // 2 minutes
	})
}

export const useCreateComment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data: CreateCommentData) => {
			const response = await fetch('/api/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Failed to create comment')
			}

			return response.json()
		},
		onSuccess: (_, variables) => {
			// Invalidate and refetch comments for this document
			queryClient.invalidateQueries({
				queryKey: ['comments', variables.docType, variables.docId]
			})
		},
	})
}
