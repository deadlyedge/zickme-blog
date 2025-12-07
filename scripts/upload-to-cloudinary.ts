import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs/promises'
import path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'content/images')

async function main() {
	cloudinary.config({
		secure: true,
	})

	if (!process.env.CLOUDINARY_API_KEY) {
		console.error('❌ CLOUDINARY_API_KEY is not set')
		process.exit(1)
	}
	// Log the configuration
	console.log(cloudinary.config())

	const files = await fs.readdir(IMAGES_DIR)
	console.log('Found files:', files)

	for (const file of files) {
		const fullPath = path.join(IMAGES_DIR, file)
		const stat = await fs.stat(fullPath)
		if (!stat.isFile()) continue

		const name = path.parse(file).name
		const publicId = `myblog/${name}`

		console.log(`Uploading ${file} → ${publicId}`)

		const res = await cloudinary.uploader.upload(fullPath, {
			public_id: publicId,
			resource_type: 'image',
			overwrite: true,
			upload_preset: 'zickme-blog', // ⭐ 使用你这个 Signed preset
		})

		console.log('Uploaded:', res.public_id, res.secure_url)
	}

	console.log('✅ Upload finished')
}

main().catch((err) => {
	console.error('❌ Upload failed', err)
	process.exit(1)
})
