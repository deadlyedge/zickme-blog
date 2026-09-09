import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { generateSlugFromPath } from '@/lib/slug'

export type ContentDiffStatus =
	| 'LOCAL_ONLY'
	| 'REMOTE_ONLY'
	| 'CONFLICT'
	| 'IN_SYNC'

export interface ContentDiffItem {
	slug: string
	status: ContentDiffStatus
	localPath?: string
	localUpdatedAt?: string
	remoteUpdatedAt?: string
}

export async function scanLocalContent(postsDir: string) {
	const files: string[] = []
	async function walk(dir: string) {
		for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
			const fullPath = path.join(dir, entry.name)
			if (entry.isDirectory()) await walk(fullPath)
			else if (entry.isFile() && entry.name.endsWith('.md'))
				files.push(fullPath)
		}
	}
	await walk(postsDir)

	const result = new Map<string, { path: string; updatedAt: Date }>()
	for (const filePath of files) {
		const raw = await fs.readFile(filePath, 'utf8')
		const { data } = matter(raw)
		const slug =
			typeof data.slug === 'string' && data.slug.trim()
				? data.slug.trim()
				: generateSlugFromPath(filePath, postsDir)
		const stat = await fs.stat(filePath)
		if (slug) result.set(slug, { path: filePath, updatedAt: stat.mtime })
	}
	return result
}

export function diffContent(
	local: Map<string, { path: string; updatedAt: Date }>,
	remote: Array<{ slug: string; updatedAt: Date }>,
): ContentDiffItem[] {
	const remoteMap = new Map(remote.map((post) => [post.slug, post]))
	const slugs = new Set([...local.keys(), ...remoteMap.keys()])
	return [...slugs].sort().map((slug) => {
		const localPost = local.get(slug)
		const remotePost = remoteMap.get(slug)
		if (!localPost)
			return {
				slug,
				status: 'REMOTE_ONLY',
				remoteUpdatedAt: remotePost?.updatedAt.toISOString(),
			}
		if (!remotePost)
			return {
				slug,
				status: 'LOCAL_ONLY',
				localPath: localPost.path,
				localUpdatedAt: localPost.updatedAt.toISOString(),
			}
		const sameTime =
			Math.abs(localPost.updatedAt.getTime() - remotePost.updatedAt.getTime()) <
			2000
		return {
			slug,
			status: sameTime ? 'IN_SYNC' : 'CONFLICT',
			localPath: localPost.path,
			localUpdatedAt: localPost.updatedAt.toISOString(),
			remoteUpdatedAt: remotePost.updatedAt.toISOString(),
		}
	})
}
