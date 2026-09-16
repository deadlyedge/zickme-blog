import {
	GALLERY_THUMBNAIL_HEIGHT,
	GALLERY_THUMBNAIL_WIDTH,
} from '@/constants/media'
import { getCloudinaryClient } from '@/lib/media/cloudinary-client'
import {
	buildGalleryPublicId,
	GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX,
} from '@/lib/media/cloudinary-public-id'
import { uploadCloudinaryImage } from '@/lib/media/cloudinary-upload'

export interface GalleryCloudinaryUpload {
	publicId: string
	url: string
	thumbnailUrl: string
}

export { buildGalleryPublicId, GALLERY_CLOUDINARY_PUBLIC_ID_PREFIX }

export async function uploadGalleryWebp(
	buffer: Buffer,
	publicId: string,
	client = getCloudinaryClient(),
): Promise<GalleryCloudinaryUpload> {
	const result = await uploadCloudinaryImage(
		buffer,
		publicId,
		{ format: 'webp', overwrite: true, invalidate: true },
		client,
	)
	return {
		publicId: result.public_id,
		url: result.secure_url,
		thumbnailUrl: client.url(result.public_id, {
			secure: true,
			resource_type: 'image',
			transformation: [
				{
					width: GALLERY_THUMBNAIL_WIDTH,
					height: GALLERY_THUMBNAIL_HEIGHT,
					crop: 'limit',
					quality: 'auto',
					fetch_format: 'auto',
				},
			],
		}),
	}
}
