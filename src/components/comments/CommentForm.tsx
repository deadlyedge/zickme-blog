'use client'

import { ArrowUpIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
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
					onKeyDown={(event) => {
						if (
							(event.ctrlKey || event.metaKey) &&
							event.key === 'Enter' &&
							content.trim() &&
							!isPending
						) {
							event.preventDefault()
							event.currentTarget.form?.requestSubmit()
						}
					}}
					placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
					aria-describedby="comment-shortcut-hint"
					required
				/>
				<InputGroupAddon align="block-end">
					<div className="flex flex-1 items-center justify-between gap-4">
						{error ? (
							<p className="text-red-500 text-xs">{error}</p>
						) : (
							<p
								id="comment-shortcut-hint"
								className="text-muted-foreground text-xs"
							>
								<kbd className=" border p-1 rounded-md">Ctrl/⌘ + Enter</kbd>{' '}
								to submit
							</p>
						)}
						<InputGroupButton
							type="submit"
							disabled={isPending || !content.trim()}
							variant={parentId ? 'secondary' : 'default'}
							className={parentId ? 'h-8 text-xs' : ''}
						>
							<ArrowUpIcon />
							{isPending ? 'Posting...' : parentId ? 'Reply' : 'Post Comment'}
						</InputGroupButton>
					</div>
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
