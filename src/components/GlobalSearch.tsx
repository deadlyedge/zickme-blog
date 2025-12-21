'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { TagIcon, FileTextIcon } from 'lucide-react'
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
import type { PostWithTags } from '@/types'

type TagWithType = {
	id: string
	name: string
	slug: string
	color: string | null
	background: string | null
	type: 'BLOG' | 'PROJECT'
}

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

	const handleTagClick = (tag: TagWithType) => {
		const basePath = tag.type === 'BLOG' ? '/blog' : '/projects'
		router.push(`${basePath}?tag=${tag.slug}`)
		onOpenChange(false)
	}

	const handlePostClick = (post: PostWithTags) => {
		const basePath = post.type === 'BLOG' ? '/blog' : '/projects'
		router.push(`${basePath}/${post.slug}`)
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
						{/* Blog Tags */}
						{data.blogTags.length > 0 && (
							<CommandGroup heading="博客标签">
								{data.blogTags.map((tag) => (
									<CommandItem
										key={`blog-${tag.id}`}
										value={`blog-${tag.name} ${tag.slug}`}
										onSelect={() => handleTagClick(tag)}
										className="flex items-center gap-2">
										<TagIcon className="h-4 w-4 text-blue-500" />
										<span>{tag.name}</span>
										<span className="ml-auto text-xs text-muted-foreground">
											博客
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{/* Project Tags */}
						{data.projectTags.length > 0 && (
							<>
								{data.blogTags.length > 0 && <CommandSeparator />}
								<CommandGroup heading="项目标签">
									{data.projectTags.map((tag) => (
										<CommandItem
											key={`project-${tag.id}`}
											value={`project-${tag.name} ${tag.slug}`}
											onSelect={() => handleTagClick(tag)}
											className="flex items-center gap-2">
											<TagIcon className="h-4 w-4 text-green-500" />
											<span>{tag.name}</span>
											<span className="ml-auto text-xs text-muted-foreground">
												项目
											</span>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}

						{/* Blog Posts */}
						{(data.blogTags.length > 0 || data.projectTags.length > 0) &&
							(data.blogPosts.length > 0 || data.projectPosts.length > 0) && (
								<CommandSeparator />
							)}

						{data.blogPosts.length > 0 && (
							<CommandGroup heading="博客文章">
								{data.blogPosts.map((post) => (
									<CommandItem
										key={`blog-post-${post.id}`}
										value={`${post.title} ${post.slug} ${post.excerpt || ''}`}
										onSelect={() => handlePostClick(post)}
										className="flex items-center gap-2">
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

						{/* Project Posts */}
						{data.projectPosts.length > 0 && (
							<>
								{data.blogPosts.length > 0 && <CommandSeparator />}
								<CommandGroup heading="项目文章">
									{data.projectPosts.map((post) => (
										<CommandItem
											key={`project-post-${post.id}`}
											value={`${post.title} ${post.slug} ${post.excerpt || ''}`}
											onSelect={() => handlePostClick(post)}
											className="flex items-center gap-2">
											<FileTextIcon className="h-4 w-4 text-green-500" />
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
							</>
						)}
					</>
				)}

				{!isLoading &&
					(!data ||
						(data.blogTags.length === 0 &&
							data.projectTags.length === 0 &&
							data.blogPosts.length === 0 &&
							data.projectPosts.length === 0)) && (
						<CommandEmpty>未找到匹配的结果</CommandEmpty>
					)}
			</CommandList>
		</CommandDialog>
	)
}
