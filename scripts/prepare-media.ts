import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { prepareGalleryImage } from '../src/lib/gallery/gallery-sync-service'

const inputRoot = path.join(process.cwd(), 'content/.gallery-input')
const galleryRoot = path.join(process.cwd(), 'content/photo-gallery')
const albumArg = process.argv.includes('--album')
	? process.argv[process.argv.indexOf('--album') + 1]
	: undefined

async function main() {
	const albums = await fs
		.readdir(inputRoot, { withFileTypes: true })
		.catch(() => [])
	const selected = albums.filter(
		(entry) => entry.isDirectory() && (!albumArg || entry.name === albumArg),
	)
	let converted = 0
	for (const album of selected) {
		const sourceDir = path.join(inputRoot, album.name)
		const targetDir = path.join(galleryRoot, album.name, 'images')
		const files = await fs.readdir(sourceDir, { withFileTypes: true })
		for (const file of files.filter((entry) => entry.isFile())) {
			if (
				!/\.(jpe?g|png|tiff?|bmp|gif|webp|avif|heic|heif)$/i.test(file.name)
			) {
				console.log(
					`[galleries] 跳过不支持的图片：${path.join(sourceDir, file.name)}`,
				)
				continue
			}
			const prepared = await prepareGalleryImage(
				path.join(sourceDir, file.name),
			)
			await fs.mkdir(targetDir, { recursive: true })
			await fs.writeFile(path.join(targetDir, prepared.file), prepared.buffer)
			converted++
			console.log(`✅ ${album.name}/${file.name} -> ${prepared.file}`)
		}
	}
	console.log(
		`媒体准备完成：${converted} 个 WebP。请编辑/确认 album.yaml 后运行 bun run gallery:index。`,
	)
}

main().catch((error) => {
	console.error(
		'媒体准备失败：',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
