import { getComments } from '@/lib/actions/comments'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'

interface CommentsSectionProps {
  docId: number
  docType: 'posts' | 'projects'
}

export async function CommentsSection({ docId, docType }: CommentsSectionProps) {
  const comments = await getComments(docId, docType)

  return (
    <section className="py-12 max-w-2xl mx-auto border-t border-slate-100 mt-12">
      <h2 className="text-2xl font-bold mb-8 text-slate-900">Comments</h2>
      
      <div className="mb-12">
         <CommentForm docId={docId} docType={docType} />
      </div>

      <CommentList comments={comments} docId={docId} docType={docType} />
    </section>
  )
}
