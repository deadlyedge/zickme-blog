import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'content/posts')

/**
 * 递归扫描所有images文件夹中的图片文件
 */
async function scanAllImages(dirPath: string): Promise<string[]> {
	const images: string[] = []

	async function scan(dir: string) {
		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name)

			if (entry.isDirectory()) {
				// 如果是images文件夹，扫描其中的图片
				if (entry.name === 'images') {
					const imageFiles = await fs.readdir(fullPath, { withFileTypes: true })
					for (const imgEntry of imageFiles) {
						if (
							imgEntry.isFile() &&
							/\.(jpg|jpeg|png|webp|gif)$/i.test(imgEntry.name)
						) {
							images.push(path.join(fullPath, imgEntry.name))
						}
					}
				} else {
					// 递归扫描其他文件夹
					await scan(fullPath)
				}
			}
		}
	}

	await scan(dirPath)
	return images
}

/**
 * 生成Cloudinary publicId，包含完整路径信息
 */
function generateCloudinaryPublicId(imagePath: string): string {
	const relativePath = path.relative(POSTS_DIR, imagePath) // posts/images/xxx.jpg 或 posts/blogs/images/xxx.jpg
	const pathWithoutExt = relativePath.replace(/\.[^/.]+$/, '') // 移除扩展名
	return pathWithoutExt.replace(/\//g, '-') // posts-images-xxx 或 posts-blogs-images-xxx
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

	// 递归扫描所有images文件夹
	const imageFiles = await scanAllImages(POSTS_DIR)
	console.log(`📁 Found ${imageFiles.length} image files:`)
	imageFiles.forEach(
		(file) => void console.log(`  - ${path.relative(POSTS_DIR, file)}`),
	)

	// 上传所有图片
	for (const imagePath of imageFiles) {
		const stat = await fs.stat(imagePath)
		if (!stat.isFile()) continue

		const publicId = generateCloudinaryPublicId(imagePath)
		const fileName = path.basename(imagePath)

		console.log(`📤 Uploading ${fileName}`)
		console.log(`   → publicId: ${publicId}`)

		try {
			const res = await cloudinary.uploader.upload(imagePath, {
				public_id: publicId,
				resource_type: 'image',
				overwrite: true,
				// upload_preset: 'zickme-blog',
			})

			console.log(`✅ Uploaded: ${res.public_id}`)
			console.log(`   URL: ${res.secure_url}`)
		} catch (error) {
			console.error(`❌ Upload failed for ${fileName}:`, error)
		}
	}

	console.log('🎉 Upload finished!')
}

main().catch((err) => {
	console.error('❌ Upload failed', err)
	process.exit(1)
})
