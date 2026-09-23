'use client'

import { Filter, Search } from 'lucide-react'
import type { SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { Tag } from '@/types/content/tag'

type PostsFiltersProps = {
	searchQuery: string
	statusFilter: string
	tagFilter: string
	tags: Tag[]
	onSearchChange: (value: string) => void
	onSearchSubmit: (event: SubmitEvent<HTMLFormElement>) => void
	onStatusChange: (value: string) => void
	onTagChange: (value: string) => void
}

export function PostsFilters({
	searchQuery,
	statusFilter,
	tagFilter,
	tags,
	onSearchChange,
	onSearchSubmit,
	onStatusChange,
	onTagChange,
}: PostsFiltersProps) {
	return (
		<Card className="shadow-2xs">
			<CardContent className="p-4">
				<div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
					<form
						onSubmit={onSearchSubmit}
						className="flex items-center gap-2 flex-1 max-w-md"
					>
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="搜索文章标题、简介或 Slug..."
								value={searchQuery}
								onChange={(event) => onSearchChange(event.target.value)}
								className="pl-8"
							/>
						</div>
						<Button type="submit" size="sm">
							搜索
						</Button>
					</form>

					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<div className="flex items-center gap-1.5">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<span className="text-xs text-muted-foreground">状态:</span>
							<Select value={statusFilter} onValueChange={onStatusChange}>
								<SelectTrigger className="w-28 h-8 text-xs">
									<SelectValue placeholder="全选状态" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">全部状态</SelectItem>
									<SelectItem value="PUBLISHED">已发布</SelectItem>
									<SelectItem value="DRAFT">草稿</SelectItem>
									<SelectItem value="ARCHIVED">已归档</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-1.5">
							<span className="text-xs text-muted-foreground">标签:</span>
							<Select value={tagFilter} onValueChange={onTagChange}>
								<SelectTrigger className="w-32 h-8 text-xs">
									<SelectValue placeholder="全部标签" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">全部标签</SelectItem>
									{tags.map((tag) => (
										<SelectItem key={tag.slug} value={tag.slug}>
											{tag.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
