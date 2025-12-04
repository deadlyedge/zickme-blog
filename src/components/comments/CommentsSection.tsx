'use client'

import { useEffect, useState } from 'react'
import { getComments } from '@/lib/actions/comments'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'
import type { CommentWithReplies } from '@/lib/actions/comments'

interface CommentsSectionProps {
  docId: number
  docType: 'posts' | 'projects'
}

export function CommentsSection({ docId, docType }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadComments() {
      try {
        setLoading(true)
        const commentsData = await getComments(docId, docType)
        setComments(commentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comments')
      } finally {
        setLoading(false)
      }
    }

    loadComments()
  }, [docId, docType])

  const handleCommentAdded = () => {
    // 重新加载评论
    getComments(docId, docType).then(setComments).catch(console.error)
  }

  if (loading) {
    return (
      <section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
        <h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
        <p className="text-red-500">{error}</p>
      </section>
    )
  }

  return (
    <section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
      <h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>

      <div className="mb-12">
         <CommentForm docId={docId} docType={docType} onSuccess={handleCommentAdded} />
      </div>

      <CommentList comments={comments} docId={docId} docType={docType} />
    </section>
  )
}
