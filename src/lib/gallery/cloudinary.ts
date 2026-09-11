import { v2 as cloudinary } from 'cloudinary'

const CLOUDINARY_FOLDER = 'photo-gallery'

export interface GalleryCloudinaryUpload {
	publicId: string
	url: string
	thumbnailUrl: string
}

export function sanitizeCloudinarySegment(value: string): string {
	const sanitized = value
		.normalize('NFKC')
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
	if (!sanitized || sanitized === '.' || sanitized === '..') {
		throw new Error(`Invalid Cloudinary path segment: ${value}`)
	}
	return sanitized
}

export function buildGalleryPublicId(
	albumSlug: string,
	fileName: string,
): string {
	const safeAlbum = sanitizeCloudinarySegment(albumSlug)
	const safeFile = sanitizeCloudinarySegment(fileName.replace(/\.webp$/i, ''))
	return `${CLOUDINARY_FOLDER}/${safeAlbum}/${safeFile}`
}

export function createGalleryCloudinaryClient(): typeof cloudinary {
	const {
		CLOUDINARY_CLOUD_NAME: cloudName,
		CLOUDINARY_API_KEY: apiKey,
		CLOUDINARY_API_SECRET: apiSecret,
	} = process.env
	if (!cloudName || !apiKey || !apiSecret) {
		throw new Error(
			'Gallery sync requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET',
		)
	}
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	})
	return cloudinary
}

export async function uploadGalleryWebp(
	buffer: Buffer,
	publicId: string,
	client = createGalleryCloudinaryClient(),
): Promise<GalleryCloudinaryUpload> {
	const result = await new Promise<{ public_id: string; secure_url: string }>(
		(resolve, reject) => {
			const stream = client.uploader.upload_stream(
				{
					public_id: publicId,
					resource_type: 'image',
					format: 'webp',
					overwrite: true,
					invalidate: true,
				},
				(error, uploadResult) => {
					if (error || !uploadResult)
						reject(error ?? new Error('Cloudinary upload returned no result'))
					else resolve(uploadResult)
				},
			)
			stream.end(buffer)
		},
	)
	return {
		publicId: result.public_id,
		url: result.secure_url,
		thumbnailUrl: client.url(result.public_id, {
			secure: true,
			resource_type: 'image',
			transformation: [
				{
					width: 640,
					height: 640,
					crop: 'limit',
					quality: 'auto',
					fetch_format: 'auto',
				},
			],
		}),
	}
}

export { CLOUDINARY_FOLDER }
