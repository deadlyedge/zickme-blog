'use client'

import { CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StatusType } from '@/types/content/post'

type PostsBulkActionsProps = {
	selectedCount: number
	isPending: boolean
	onStatusChange: (status: StatusType) => void
	onClearSelection: () => void
}

export function PostsBulkActions({
	selectedCount,
	isPending,
	onStatusChange,
	onClearSelection,
}: PostsBulkActionsProps) {
	if (selectedCount === 0) return null

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl shadow-xs">
			<div className="text-sm font-medium flex items-center gap-2">
				<CheckSquare className="h-4 w-4 text-primary" />
				已选中 <Badge variant="default">{selectedCount}</Badge> 篇文章
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					onClick={() => onStatusChange('PUBLISHED')}
					disabled={isPending}
					className="h-8 text-xs bg-background"
				>
					批量设为已发布
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => onStatusChange('DRAFT')}
					disabled={isPending}
					className="h-8 text-xs bg-background"
				>
					批量设为草稿
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => onStatusChange('ARCHIVED')}
					disabled={isPending}
					className="h-8 text-xs bg-background text-amber-600 hover:text-amber-700"
				>
					批量归档
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={onClearSelection}
					className="h-8 text-xs"
				>
					取消选择
				</Button>
			</div>
		</div>
	)
}
