import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { stringify } from 'yaml'
import { db } from '@/db'
import { posts, siteProfile } from '@/db/schema'
import { toSiteFilesForExport } from '@/lib/publish/site-export'
import { SITE_CONTENT_ROOT } from '@/lib/publish/site-input-reader'
import {
	SITE_FILE_NAMES,
	siteFileSchemaByName,
} from '@/lib/publish/site-schema'
import type { SiteProfile } from '@/types/site'

const force = process.argv.includes('--force')

async function main() {
	const [profile] = await db.select().from(siteProfile).limit(1)
	if (!profile) throw new Error('siteProfile 没有数据，无法导出站点设置。')
	const postRows = await db
		.select({ id: posts.id, slug: posts.slug })
		.from(posts)
	const exported = toSiteFilesForExport(
		profile as unknown as SiteProfile,
		new Map(postRows.map((post) => [post.id, post.slug])),
	)
	const values = [
		exported.files.profile,
		exported.files.social,
		exported.files.skills,
		exported.files.slogans,
		exported.files.theme,
		exported.files.landing,
		exported.files.about,
	]
	for (const [index, fileName] of SITE_FILE_NAMES.entries()) {
		const value = values[index]
		const result = siteFileSchemaByName[fileName]?.safeParse(value)
		if (!result?.success)
			throw new Error(
				`数据库中的 ${SITE_FILE_NAMES[index]} 不符合站点内容 schema：${result?.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
			)
	}

	await fs.mkdir(SITE_CONTENT_ROOT, { recursive: true })
	let written = 0
	for (const [index, fileName] of SITE_FILE_NAMES.entries()) {
		const value = values[index]
		if (value === undefined) continue
		const filePath = path.join(SITE_CONTENT_ROOT, fileName)
		try {
			await fs.access(filePath)
			if (!force) {
				console.log(`⏭️ 已存在，跳过：${path.relative(process.cwd(), filePath)}`)
				continue
			}
		} catch {
			// The file does not exist; create it without replacing a concurrent writer.
		}
		const serialized = stringify(value, { lineWidth: 120 })
		if (force) await fs.writeFile(filePath, serialized, 'utf8')
		else {
			try {
				await fs.writeFile(filePath, serialized, {
					encoding: 'utf8',
					flag: 'wx',
				})
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
					console.log(
						`⏭️ 已存在，跳过：${path.relative(process.cwd(), filePath)}`,
					)
					continue
				}
				throw error
			}
		}
		written++
		console.log(`✅ 已导出：${path.relative(process.cwd(), filePath)}`)
	}
	console.log(
		`数据库只读导出完成：新写入 ${written}/${SITE_FILE_NAMES.length} 个文件。`,
	)
	if (exported.hasLegacyAvatar)
		console.warn(
			'⚠️ 数据库中已有头像。请人工准备 content/site/portrait.webp；此命令不会下载头像，也不会将任意 URL 写进内容文件。',
		)
	if (exported.unmappedPinnedIds.length > 0)
		console.warn(
			`⚠️ 有 ${exported.unmappedPinnedIds.length} 个 pinnedPostIds 无法映射到现存文章；请人工检查并补充 landing.yaml 的 pinnedPostSlugs。`,
		)
	console.warn(
		'请人工审阅并提交 YAML，再运行 bun run publish -- --scope site --dry-run --json。',
	)
}

main().catch((error) => {
	console.error(
		'❌ 站点设置导出失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
