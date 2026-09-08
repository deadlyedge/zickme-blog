import fs from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')
const MAX_IMAGE_WIDTH = 3840
const MAX_IMAGE_HEIGHT = 2160

/**
 * 递归扫描所有 images 文件夹中的图片文件
 */
async function scanAllImages(dirPath: string): Promise<string[]> {
	const images: string[] = []

	async function scan(dir: string) {
		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				if (entry.name === 'images') {
					const imageFiles = await fs.readdir(fullPath, { withFileTypes: true })
					for (const imgEntry of imageFiles) {
						if (
							imgEntry.isFile() &&
							/\.(jpg|jpeg|png|webp|gif|bmp|tiff)$/i.test(imgEntry.name)
						) {
							images.push(path.join(fullPath, imgEntry.name))
						}
					}
				} else {
					await scan(fullPath)
				}
			}
		}
	}

	await scan(dirPath)
	return images
}

/**
 * 生成 Cloudinary publicId，包含完整相对路径
 */
function generateCloudinaryPublicId(imagePath: string): string {
	const relativePath = path.relative(POSTS_DIR, imagePath)
	const pathWithoutExt = relativePath.replace(/\.[^/.]+$/, '')
	return pathWithoutExt.replace(/[\\/]/g, '-')
}

/**
 * 在内存中将图片优化并预转为高质量 WebP
 */
async function optimizeImageToWebp(
	inputBuffer: Buffer,
	ext: string,
): Promise<{ buffer: Buffer; isWebp: boolean }> {
	// 如果本身是 gif 或 svg，保留原生动画/矢量特性
	if (/^\.(gif|svg)$/i.test(ext)) {
		return { buffer: inputBuffer, isWebp: false }
	}

	try {
		const image = sharp(inputBuffer)
		const metadata = await image.metadata()

		let pipeline = image
		if (
			(metadata.width && metadata.width > MAX_IMAGE_WIDTH) ||
			(metadata.height && metadata.height > MAX_IMAGE_HEIGHT)
		) {
			pipeline = pipeline.resize({
				width: MAX_IMAGE_WIDTH,
				height: MAX_IMAGE_HEIGHT,
				fit: 'inside',
				withoutEnlargement: true,
			})
		}

		const outputBuffer = await pipeline
			.webp({ quality: 85, effort: 4 })
			.toBuffer()
		return { buffer: outputBuffer, isWebp: true }
	} catch (err) {
		console.warn('⚠️ WebP 预转换降级，使用原图:', err)
		return { buffer: inputBuffer, isWebp: false }
	}
}

async function main() {
	cloudinary.config({
		secure: true,
	})

	if (!process.env.CLOUDINARY_API_KEY) {
		console.error('❌ CLOUDINARY_API_KEY is not set')
		process.exit(1)
	}

	console.log('Cloudinary config:', {
		cloud_name: cloudinary.config().cloud_name,
		api_key: cloudinary.config().api_key ? '***' : undefined,
	})

	const imageFiles = await scanAllImages(POSTS_DIR)
	console.log(`📁 Found ${imageFiles.length} image files:`)
	for (const file of imageFiles) {
		console.log(`  - ${path.relative(POSTS_DIR, file)}`)
	}

	for (const imagePath of imageFiles) {
		const stat = await fs.stat(imagePath)
		if (!stat.isFile()) continue

		const publicId = generateCloudinaryPublicId(imagePath)
		const fileName = path.basename(imagePath)
		const ext = path.extname(imagePath)

		console.log(`📤 Processing & Uploading ${fileName}`)
		console.log(`   → publicId: ${publicId}`)

		try {
			const originalBuffer = await fs.readFile(imagePath)
			const { buffer: optimizedBuffer, isWebp } = await optimizeImageToWebp(
				originalBuffer,
				ext,
			)

			const res = await new Promise<{ public_id: string; secure_url: string }>(
				(resolve, reject) => {
					const uploadStream = cloudinary.uploader.upload_stream(
						{
							public_id: publicId,
							resource_type: 'image',
							overwrite: true,
						},
						(error, result) => {
							if (error || !result) {
								reject(error || new Error('Upload result is undefined'))
							} else {
								resolve(result)
							}
						},
					)
					uploadStream.end(optimizedBuffer)
				},
			)

			console.log(
				`✅ Uploaded [${isWebp ? 'WebP 85%' : ext}]: ${res.public_id}`,
			)
			console.log(`   URL: ${res.secure_url}`)
		} catch (error) {
			console.error(`❌ Upload failed for ${fileName}:`, error)
		}
	}

	console.log('🎉 All uploads finished!')
}

main().catch((err) => {
	console.error('❌ Upload failed', err)
	process.exit(1)
})
