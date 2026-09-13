import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { parse, stringify } from 'yaml'
import { scanGalleryDirectory } from '../src/lib/gallery/gallery-parser'

const args = process.argv.slice(2)
const patchIndex = args.indexOf('--patch')
const patchPath = patchIndex >= 0 ? args[patchIndex + 1] : undefined
const dryRun = args.includes('--dry-run')

if (!patchPath || patchPath.startsWith('--')) {
	console.error(
		'用法：bun run gallery:pull -- --patch ./gallery-patch.yaml [--dry-run]',
	)
	process.exit(1)
}
const resolvedPatchPath = patchPath

interface GalleryPatch {
	album: string
	expectedHash?: string
	fields: Record<string, unknown>
}

async function main() {
	const parsed = parse(
		await fs.readFile(path.resolve(resolvedPatchPath), 'utf8'),
	) as unknown
	if (!Array.isArray(parsed)) throw new Error('patch 必须是数组')
	const scan = await scanGalleryDirectory()
	for (const patch of parsed as GalleryPatch[]) {
		if (!patch || typeof patch.album !== 'string' || !patch.fields)
			throw new Error('patch 字段无效')
		const album = scan.albums.find(
			(item) => path.basename(item.directory) === patch.album,
		)
		if (!album) throw new Error(`找不到相册：${patch.album}`)
		const current = parse(
			await fs.readFile(album.configPath, 'utf8'),
		) as Record<string, unknown>
		if (patch.expectedHash && patch.expectedHash !== JSON.stringify(current))
			throw new Error(
				`相册 ${patch.album} 已发生本地变更，停止应用 patch 以避免覆盖`,
			)
		if (!dryRun)
			await fs.writeFile(
				album.configPath,
				stringify({ ...current, ...patch.fields }, { lineWidth: 120 }),
				'utf8',
			)
		console.log(
			`${dryRun ? '[dry-run] 检查' : '已应用'} ${patch.album}/album.yaml`,
		)
	}
	console.log('完成；如需更新 gallery.yaml，请继续执行 bun run gallery:index')
}

main().catch((error) => {
	console.error(
		'Gallery 回写失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
