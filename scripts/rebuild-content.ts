import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { stringify } from 'yaml'
import {
	createAlbumSkeleton,
	GALLERY_ROOT,
	scanGalleryDirectory,
	writeGalleryIndex,
} from '../src/lib/gallery/gallery-parser'

const dryRun = process.argv.includes('--dry-run')
const albumArg = process.argv.includes('--album')
	? process.argv[process.argv.indexOf('--album') + 1]
	: undefined

async function main() {
	const scan = await scanGalleryDirectory(GALLERY_ROOT)
	for (const album of scan.albums) {
		if (albumArg && path.basename(album.directory) !== albumArg) continue
		if (!album.issues.includes('缺少 album.yaml')) continue
		const value = createAlbumSkeleton(
			path.basename(album.directory),
			album.files,
		)
		console.log(
			`${dryRun ? '🔎 将生成' : '✅ 生成'} ${path.relative(process.cwd(), album.configPath)}`,
		)
		if (!dryRun) {
			await fs.mkdir(album.directory, { recursive: true })
			await fs.writeFile(
				album.configPath,
				stringify(value, { lineWidth: 120 }),
				'utf8',
			)
		}
	}
	if (dryRun) {
		console.log('🔎 dry-run：未写入 album.yaml 或 gallery.yaml。')
		return
	}
	const refreshed = await scanGalleryDirectory(GALLERY_ROOT)
	await writeGalleryIndex(refreshed.albums, GALLERY_ROOT)
	console.log('✅ 已生成 gallery.yaml；请编辑并确认 album.yaml 后再 publish。')
}

main().catch((error) => {
	console.error(
		'内容结构重建失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
