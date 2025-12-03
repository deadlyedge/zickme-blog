'use client'

import { useComments } from '@/hooks/useComments'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'

interface CommentsSectionProps {
	docId: number
	docType: 'posts' | 'projects'
}

export function CommentsSectionClient({ docId, docType }: CommentsSectionProps) {
	const { data: comments, isLoading, error } = useComments(docId, docType)

	if (isLoading) {
		return (
			<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
				<h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
				<div className="text-center py-8 text-slate-500">Loading comments...</div>
			</section>
		)
	}

	if (error) {
		return (
			<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
				<h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
				<div className="text-center py-8 text-red-500">Failed to load comments</div>
			</section>
		)
	}

	return (
		<section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
			<h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>

			<div className="mb-12">
				<CommentForm docId={docId} docType={docType} />
			</div>

			<CommentList comments={comments || []} docId={docId} docType={docType} />
		</section>
	)
}
