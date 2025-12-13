'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

import { ArrowUpIcon } from 'lucide-react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from '@/components/ui/input-group'

import { useCreateComment } from '@/lib/hooks/useContent'
import { useAppStore } from '@/lib/store'

interface CommentFormProps {
	docId: string
	parentId?: string
	autoFocus?: boolean
}

export function CommentForm({ docId, parentId, autoFocus }: CommentFormProps) {
	const [content, setContent] = useState('')
	const [error, setError] = useState<string | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const pathname = usePathname()

	const { mutateAsync, isPending } = useCreateComment()
	const { clearActiveReplyId } = useAppStore()

	useEffect(() => {
		if (autoFocus && textareaRef.current) {
			textareaRef.current.focus()
		}
	}, [autoFocus])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!content.trim()) return

		setError(null)

		try {
			const result = await mutateAsync({
				content,
				docId,
				parentId,
				path: pathname || '/',
			})

			if (result.success) {
				setContent('')
				// 使用zustand关闭回复表单
				clearActiveReplyId()
				toast.success('Comment posted successfully')
			} else {
				setError(result.error || 'Failed to post comment')
			}
		} catch {
			setError('Failed to post comment')
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<InputGroup>
				<InputGroupTextarea
					ref={textareaRef}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
					required
				/>
				<InputGroupAddon align="block-end">
					{error && <p className="text-red-500 text-xs">{error}</p>}
					<InputGroupButton
						type="submit"
						disabled={isPending || !content.trim()}
						variant={parentId ? 'secondary' : 'default'}
						className={parentId ? 'h-8 text-xs' : ''}>
						<ArrowUpIcon />
						{isPending ? 'Posting...' : parentId ? 'Reply' : 'Post Comment'}
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>

			{/* 
			<div className="flex justify-end">
				<Button
					type="submit"
					disabled={isPending || !content.trim()}
					variant={parentId ? 'secondary' : 'default'}
					className={parentId ? 'h-8 text-xs' : ''}></Button>
			</div> */}
		</form>
	)
}
