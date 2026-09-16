import type { UploadApiResponse } from 'cloudinary'
import { getCloudinaryClient } from '@/lib/media/cloudinary-client'
import { toCloudinaryPublicId } from '@/lib/media/cloudinary-public-id'

export interface CloudinaryImageUploadOptions {
	format?: string
	overwrite?: boolean
	invalidate?: boolean
}

export async function uploadCloudinaryImage(
	buffer: Buffer,
	publicId: string,
	options: CloudinaryImageUploadOptions = {},
	client = getCloudinaryClient(),
): Promise<UploadApiResponse> {
	const normalizedId = toCloudinaryPublicId(publicId)
	return new Promise((resolve, reject) => {
		const stream = client.uploader.upload_stream(
			{
				public_id: normalizedId,
				resource_type: 'image',
				...(options.format ? { format: options.format } : {}),
				overwrite: options.overwrite ?? true,
				invalidate: options.invalidate ?? false,
			},
			(error, result) => {
				if (error || !result)
					reject(error ?? new Error('Cloudinary upload returned no result'))
				else resolve(result)
			},
		)
		stream.end(buffer)
	})
}
