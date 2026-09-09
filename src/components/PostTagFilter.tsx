'use client'

import { Check, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export type TagItem = {
	id: string
	name: string
	slug: string
	color: string | null
}

interface PostTagFilterProps {
	tags: TagItem[]
	activeTag: string
	totalPostsCount: number
	getTagPostCount: (slug: string) => number
	onTagSelect: (slug: string) => void
}

export function PostTagFilter({
	tags,
	activeTag,
	totalPostsCount,
	getTagPostCount,
	onTagSelect,
}: PostTagFilterProps) {
	const [isSearchOpen, setIsSearchOpen] = useState(false)
	const [popoverSearchTerm, setPopoverSearchTerm] = useState('')

	const searchFilteredTags = useMemo(() => {
		if (!popoverSearchTerm.trim()) return tags
		const term = popoverSearchTerm.toLowerCase().trim()
		return tags.filter(
			(t) =>
				t.name.toLowerCase().includes(term) ||
				t.slug.toLowerCase().includes(term),
		)
	}, [tags, popoverSearchTerm])

	const currentTag = useMemo(() => {
		if (activeTag === 'All') return null
		return tags.find((t) => t.slug === activeTag) || null
	}, [tags, activeTag])

	const activeTagName = currentTag?.name || activeTag
	const currentTagCount = currentTag ? getTagPostCount(currentTag.slug) : 0

	return (
		<div className="flex items-center justify-between gap-3 select-none py-1">
			{/* 左侧：全部 & 当前激活的标签 */}
			<div className="flex items-center gap-2 min-w-0">
				<button
					type="button"
					onClick={() => onTagSelect('All')}
					className={cn(
						'relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 shrink-0 cursor-pointer',
						activeTag === 'All'
							? 'bg-primary text-primary-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 border border-border/40',
					)}
				>
					<LayoutGrid className="size-3.5" />
					<span>全部</span>
					<span
						className={cn(
							'ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono',
							activeTag === 'All'
								? 'bg-primary-foreground/20 text-primary-foreground'
								: 'bg-muted-foreground/15 text-muted-foreground',
						)}
					>
						{totalPostsCount}
					</span>
				</button>

				{currentTag && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/30 shadow-2xs"
					>
						<span
							className="size-2 rounded-full shrink-0"
							style={{
								backgroundColor: currentTag.color || 'var(--primary)',
							}}
						/>
						<span className="truncate max-w-30 sm:max-w-50">
							{currentTag.name}
						</span>
						<span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary/15 text-primary ml-0.5">
							{currentTagCount}
						</span>
						<button
							type="button"
							onClick={() => onTagSelect('All')}
							className="ml-1 p-0.5 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors cursor-pointer"
							aria-label="清除当前标签过滤"
						>
							<X className="size-3.5" />
						</button>
					</motion.div>
				)}
			</div>
			{/* 右侧：过滤标签 Popover 菜单 */}
			<div className="shrink-0">
				<Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								'h-8 px-3 rounded-full text-xs font-semibold gap-1.5 border border-border/60 bg-muted/20 hover:bg-muted/50 transition-all shadow-2xs cursor-pointer',
								activeTag !== 'All' &&
									'border-primary/50 text-primary bg-primary/5',
							)}
						>
							<SlidersHorizontal className="size-3.5" />
							<span>过滤标签</span>
							<span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-muted text-muted-foreground border">
								{tags.length}
							</span>
						</Button>
					</PopoverTrigger>

					<PopoverContent
						align="end"
						className="w-80 p-3 rounded-2xl shadow-xl border-border/70 backdrop-blur-xl bg-card/95"
					>
						{/* Popover 搜索栏 */}
						<div className="relative mb-3">
							<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
							<input
								type="text"
								placeholder="搜索或过滤标签..."
								value={popoverSearchTerm}
								onChange={(e) => setPopoverSearchTerm(e.target.value)}
								className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-muted/40 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
							/>
							{popoverSearchTerm && (
								<button
									type="button"
									onClick={() => setPopoverSearchTerm('')}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
								>
									<X className="size-3" />
								</button>
							)}
						</div>

						{/* 标签快捷切换列表 */}
						<div className="max-h-60 overflow-y-auto space-y-1 pr-1">
							{/* 全部选项 */}
							<button
								type="button"
								onClick={() => {
									onTagSelect('All')
									setIsSearchOpen(false)
								}}
								className={cn(
									'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
									activeTag === 'All'
										? 'bg-primary/10 text-primary font-bold'
										: 'hover:bg-muted/60 text-foreground',
								)}
							>
								<span className="flex items-center gap-2">
									<LayoutGrid className="size-3.5 opacity-70" />
									全部文章
								</span>
								<span className="flex items-center gap-1.5">
									<span className="text-[10px] font-mono text-muted-foreground">
										{totalPostsCount}
									</span>
									{activeTag === 'All' && <Check className="size-3.5" />}
								</span>
							</button>

							{/* 过滤结果 */}
							{searchFilteredTags.map((tag) => {
								const isSelected = activeTag === tag.slug
								const count = getTagPostCount(tag.slug)

								return (
									<button
										type="button"
										key={tag.slug}
										onClick={() => {
											onTagSelect(tag.slug)
											setIsSearchOpen(false)
										}}
										className={cn(
											'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer',
											isSelected
												? 'bg-primary/10 text-primary font-bold'
												: 'hover:bg-muted/60 text-foreground',
										)}
									>
										<span className="flex items-center gap-2 truncate pr-2">
											<span
												className="size-2 rounded-full shrink-0"
												style={{
													backgroundColor: tag.color || 'var(--primary)',
												}}
											/>
											<span className="truncate">{tag.name}</span>
										</span>
										<span className="flex items-center gap-1.5 shrink-0">
											<span className="text-[10px] font-mono text-muted-foreground">
												{count}
											</span>
											{isSelected && <Check className="size-3.5" />}
										</span>
									</button>
								)
							})}

							{searchFilteredTags.length === 0 && (
								<div className="py-6 text-center text-xs text-muted-foreground">
									未找到匹配的标签
								</div>
							)}
						</div>

						{activeTag !== 'All' && (
							<div className="pt-2 mt-2 border-t border-border/40 flex justify-between items-center text-[11px]">
								<span className="text-muted-foreground truncate pr-2">
									当前筛选：
									<span className="font-semibold text-foreground">
										{activeTagName}
									</span>
								</span>
								<button
									type="button"
									onClick={() => {
										onTagSelect('All')
										setIsSearchOpen(false)
									}}
									className="text-primary hover:underline font-medium shrink-0 cursor-pointer"
								>
									清除筛选
								</button>
							</div>
						)}
					</PopoverContent>
				</Popover>
			</div>
		</div>
	)
}
