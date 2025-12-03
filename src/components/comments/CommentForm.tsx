'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createComment } from '@/lib/actions/comments'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
	docId: number
	docType: 'posts' | 'projects'
	parentId?: number
	onSuccess?: () => void
	autoFocus?: boolean
}

export function CommentForm({
	docId,
	docType,
	parentId,
	onSuccess,
	autoFocus,
}: CommentFormProps) {
	const [content, setContent] = useState('')
	const [name, setName] = useState('')
	const [email, setEmail] = useState('') // Store but maybe not mandatory if we just want name
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const pathname = usePathname()

	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus()
		}
	}, [autoFocus])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!content.trim()) return

		setIsSubmitting(true)
		setError(null)

		const result = await createComment({
			content,
			docId,
			docType,
			parentId,
			authorName: name || 'Anonymous',
			authorEmail: email,
			path: pathname || '/',
		})

		setIsSubmitting(false)

		if (result.success) {
			setContent('')
			// Keep name/email for convenience?
			if (onSuccess) onSuccess()
		} else {
			setError(result.error || 'Failed to post comment')
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{!parentId && (
				<div className="flex gap-4">
					<input
						type="text"
						placeholder="Name (optional)"
						className="flex-1 bg-slate-50 border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<input
						type="email"
						placeholder="Email (private)"
						className="flex-1 bg-slate-50 border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-amber-600/20 outline-none transition-all"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>
			)}

			<div className="relative">
				<textarea
					ref={textareaRef}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
					className="w-full min-h-[100px] bg-slate-50 border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-amber-600/20 outline-none resize-y transition-all placeholder:text-slate-400"
					required
				/>
			</div>

			{error && <p className="text-red-500 text-xs">{error}</p>}

			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={isSubmitting || !content.trim()}
					variant={parentId ? 'secondary' : 'default'}
					className={parentId ? 'h-8 text-xs' : ''}>
					{isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Post Comment'}
				</Button>
			</div>
		</form>
	)
}
