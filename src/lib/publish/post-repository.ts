import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { posts, postsToTags, tags } from '@/db/schema'
import { generateSlug } from '@/lib/slug'
import type { ProcessedPost } from '@/types/post-types'
import type { SyncLogItem } from '@/types/sync'

type RepositoryLog = (
	stage: SyncLogItem['stage'],
	level: SyncLogItem['level'],
	message: string,
	detail?: string,
) => void

export function hasPostSourcePathConflict(
	existingSourcePath: string | null,
	incomingSourcePath: string,
): boolean {
	return Boolean(
		existingSourcePath && existingSourcePath !== incomingSourcePath,
	)
}

export class PostRepository {
	async savePosts(
		postsList: ProcessedPost[],
		addLog: RepositoryLog,
	): Promise<number> {
		const allTagNames = Array.from(
			new Set(postsList.flatMap((post) => post.tags)),
		).filter(Boolean)
		const tagNameToId = new Map<string, string>()

		for (const tagName of allTagNames) {
			const tagSlug = generateSlug(tagName)
			try {
				const existing = await db.query.tags.findFirst({
					where: eq(tags.name, tagName),
				})
				if (existing) {
					tagNameToId.set(tagName, existing.id)
				} else {
					const [newTag] = await db
						.insert(tags)
						.values({ name: tagName, slug: tagSlug })
						.returning()
					tagNameToId.set(tagName, newTag.id)
					addLog('db', 'info', `创建新标签: ${tagName}`)
				}
			} catch (error) {
				addLog(
					'db',
					'warn',
					`处理标签失败: ${tagName}`,
					error instanceof Error ? error.message : String(error),
				)
			}
		}

		let successCount = 0
		for (const post of postsList) {
			try {
				const existingPost = await db.query.posts.findFirst({
					where: eq(posts.slug, post.slug),
				})

				let postId: string
				if (existingPost) {
					if (
						hasPostSourcePathConflict(existingPost.sourcePath, post.sourcePath)
					) {
						addLog(
							'frontmatter',
							'error',
							`拒绝覆盖 Slug 冲突: ${post.slug}`,
							`当前文件 ${post.sourcePath} 与数据库来源 ${existingPost.sourcePath} 不同，请修改 Frontmatter slug`,
						)
						continue
					}

					postId = existingPost.id
					await db
						.update(posts)
						.set({
							sourcePath: post.sourcePath,
							title: post.title,
							excerpt: post.excerpt,
							poster: post.poster,
							content: post.content,
							publishedAt: post.publishedAt,
							status: post.status,
							sourceUrl: post.sourceUrl,
							metadata: post.metadata,
							archivedAt: null,
							updatedAt: new Date(),
						})
						.where(eq(posts.id, postId))
					addLog(
						'db',
						'success',
						`文章更新成功: [${post.title}] (${post.slug})`,
					)
				} else {
					const [newPost] = await db
						.insert(posts)
						.values({
							slug: post.slug,
							sourcePath: post.sourcePath,
							title: post.title,
							excerpt: post.excerpt,
							poster: post.poster,
							content: post.content,
							publishedAt: post.publishedAt,
							status: post.status,
							sourceUrl: post.sourceUrl,
							metadata: post.metadata,
						})
						.returning()
					postId = newPost.id
					addLog(
						'db',
						'success',
						`文章新建入库: [${post.title}] (${post.slug})`,
					)
				}

				await db.delete(postsToTags).where(eq(postsToTags.postId, postId))
				for (const tagName of post.tags) {
					const tagId = tagNameToId.get(tagName)
					if (tagId) {
						await db.insert(postsToTags).values({
							postId,
							tagId,
						})
					}
				}
				successCount++
			} catch (error) {
				addLog(
					'db',
					'error',
					`写入文章失败: ${post.slug}`,
					error instanceof Error ? error.message : String(error),
				)
			}
		}

		return successCount
	}
}

export const postRepository = new PostRepository()
