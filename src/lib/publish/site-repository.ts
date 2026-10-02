import type { InferInsertModel } from 'drizzle-orm'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { posts, siteProfile } from '@/db/schema'

export async function resolvePostIdsBySlugs(
	slugs: string[],
): Promise<string[]> {
	if (slugs.length === 0) return []

	const rows = await db
		.select({ id: posts.id, slug: posts.slug })
		.from(posts)
		.where(inArray(posts.slug, slugs))
	const idBySlug = new Map(rows.map((row) => [row.slug, row.id]))
	const missingSlugs = slugs.filter((slug) => !idBySlug.has(slug))
	if (missingSlugs.length > 0) {
		throw new Error(
			`数据库中找不到 pinnedPostSlugs 对应文章：${missingSlugs.join(', ')}`,
		)
	}

	const postIds: string[] = []
	for (const slug of slugs) {
		const postId = idBySlug.get(slug)
		if (!postId)
			throw new Error(`数据库中找不到 pinnedPostSlugs 对应文章：${slug}`)
		postIds.push(postId)
	}
	return postIds
}

export type SiteProfileInsert = InferInsertModel<typeof siteProfile>

export async function upsertSiteProfile(
	values: SiteProfileInsert,
): Promise<void> {
	const [existing] = await db
		.select({ id: siteProfile.id })
		.from(siteProfile)
		.limit(1)
	if (existing) {
		await db
			.update(siteProfile)
			.set({ ...values, updatedAt: new Date() })
			.where(eq(siteProfile.id, existing.id))
		return
	}
	await db.insert(siteProfile).values(values)
}
