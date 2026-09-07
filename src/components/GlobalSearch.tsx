'use client'

import { useQuery } from '@tanstack/react-query'
import { FileTextIcon, TagIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from '@/components/ui/command'
import { searchContentOptions } from '@/lib/content-queries'
import type { PostWithTags, Tag } from '@/types'

interface GlobalSearchProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
	const router = useRouter()

	const { data, isLoading } = useQuery({
		...searchContentOptions(),
		enabled: open, // 只在对话框打开时获取数据
	})

	const handleTagClick = (tag: Tag) => {
		router.push(`/posts?tag=${tag.slug}`)
		onOpenChange(false)
	}

	const handlePostClick = (post: PostWithTags) => {
		router.push(`/posts/${post.slug}`)
		onOpenChange(false)
	}

	return (
		<CommandDialog open={open} onOpenChange={onOpenChange}>
			<CommandInput placeholder="搜索标签或文章..." />
			<CommandList>
				{isLoading && (
					<div className="py-6 text-center text-sm text-muted-foreground">
						正在加载搜索数据...
					</div>
				)}

				{!isLoading && data && (
					<>
						{/* Tags */}
						{data.tags.length > 0 && (
							<CommandGroup heading="文章标签">
								{data.tags.map((tag) => (
									<CommandItem
										key={`tag-${tag.id}`}
										value={`${tag.name} ${tag.slug}`}
										onSelect={() => handleTagClick(tag)}
										className="flex items-center gap-2"
									>
										<TagIcon className="h-4 w-4 text-blue-500" />
										<span>{tag.name}</span>
										<span className="ml-auto text-xs text-muted-foreground">
											标签
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{data.tags.length > 0 && data.posts.length > 0 && (
							<CommandSeparator />
						)}

						{/* Posts */}
						{data.posts.length > 0 && (
							<CommandGroup heading="文章">
								{data.posts.map((post) => (
									<CommandItem
										key={`post-${post.id}`}
										value={`${post.title} ${post.slug} ${post.excerpt || ''}`}
										onSelect={() => handlePostClick(post)}
										className="flex items-center gap-2"
									>
										<FileTextIcon className="h-4 w-4 text-blue-500" />
										<div className="flex flex-col">
											<span className="font-medium">{post.title}</span>
											{post.excerpt && (
												<span className="text-xs text-muted-foreground truncate max-w-md">
													{post.excerpt}
												</span>
											)}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</>
				)}

				{!isLoading &&
					(!data || (data.tags.length === 0 && data.posts.length === 0)) && (
						<CommandEmpty>未找到匹配的结果</CommandEmpty>
					)}
			</CommandList>
		</CommandDialog>
	)
}
