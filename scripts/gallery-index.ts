import {
	GALLERY_ROOT,
	scanGalleryDirectory,
	writeGalleryIndex,
} from '../src/lib/gallery/gallery-parser'

async function main(): Promise<void> {
	const scan = await scanGalleryDirectory(GALLERY_ROOT)
	if (scan.issues.length > 0) {
		console.error('❌ Gallery 索引未生成，发现以下问题：')
		for (const issue of scan.issues) console.error(`   ${issue}`)
		process.exitCode = 1
		return
	}

	if (process.argv.includes('--dry-run')) {
		console.log(
			`🔎 Gallery 索引预览通过（${scan.albums.length} 个相册），未写入 gallery.yaml。`,
		)
		return
	}
	await writeGalleryIndex(scan.albums, GALLERY_ROOT)
	console.log(
		`✅ 已生成 content/photo-gallery/gallery.yaml（${scan.albums.length} 个相册）`,
	)
	console.log('ℹ️ gallery.yaml 是自动生成文件，请编辑对应相册的 album.yaml')
}

main().catch((error) => {
	console.error('❌ Gallery 索引失败:', error)
	process.exitCode = 1
})
