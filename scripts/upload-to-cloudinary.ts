import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'content/images')

async function main() {
	cloudinary.config({
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
		secure: true,
	})

	const files = await fs.readdir(IMAGES_DIR)
	console.log('Found files:', files)

	for (const file of files) {
		const fullPath = path.join(IMAGES_DIR, file)
		const stat = await fs.stat(fullPath)
		if (!stat.isFile()) continue

		const publicId = `myblog/${path.parse(file).name}`

		console.log(`Uploading ${file} → ${publicId}`)

		await cloudinary.uploader.upload(fullPath, {
			public_id: publicId,
			overwrite: true,
			resource_type: 'image',
			upload_preset: 'zickme-blog',
		})
	}

	console.log('✅ Upload finished')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
