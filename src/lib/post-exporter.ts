import matter from 'gray-matter'
import type { PostWithTags } from '@/types'

export function postToMarkdown(post: PostWithTags): string {
	const metadata =
		post.metadata && typeof post.metadata === 'object' ? post.metadata : {}
	const frontmatter: Record<string, unknown> = {
		title: post.title,
		slug: post.slug,
		date: (post.publishedAt || post.createdAt).toISOString().slice(0, 10),
		tags: post.tags?.map((tag) => tag.name) || [],
		status: post.status.toLowerCase(),
		...(post.excerpt ? { excerpt: post.excerpt } : {}),
		...(post.poster ? { image: post.poster } : {}),
		...(post.sourceUrl ? { sourceUrl: post.sourceUrl } : {}),
		...(metadata && typeof metadata === 'object' ? metadata : {}),
	}

	return `${matter.stringify(post.content || '', frontmatter).trim()}\n`
}

export function safeMarkdownFileName(slug: string): string {
	const safeSlug = slug.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '-')
	return `${safeSlug || 'untitled'}.md`
}
