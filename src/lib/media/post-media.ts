import sharp from 'sharp'
import {
	POST_MEDIA_MAX_HEIGHT,
	POST_MEDIA_MAX_WIDTH,
	POST_MEDIA_WEBP_EFFORT,
	POST_MEDIA_WEBP_QUALITY,
} from '@/constants/media'
import { getCloudinaryConfiguration } from '@/lib/media/cloudinary-client'
import {
	buildPostPublicId,
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
} from '@/lib/media/cloudinary-public-id'
import { uploadCloudinaryImage } from '@/lib/media/cloudinary-upload'

export interface PostMediaUploadOptions {
	dryRun?: boolean
	onLog?: (
		level: 'info' | 'warn' | 'error',
		message: string,
		detail?: string,
	) => void
}

export {
	buildPostPublicId as buildPostMediaPublicId,
	POST_CLOUDINARY_PUBLIC_ID_PREFIX,
}

export function getPostMediaBaseUrl(): string | null {
	return getCloudinaryConfiguration().baseUrl
}

async function optimizePostImage(inputBuffer: Buffer): Promise<Buffer> {
	return sharp(inputBuffer)
		.resize({
			width: POST_MEDIA_MAX_WIDTH,
			height: POST_MEDIA_MAX_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true,
		})
		.webp({ quality: POST_MEDIA_WEBP_QUALITY, effort: POST_MEDIA_WEBP_EFFORT })
		.toBuffer()
}

export async function uploadPostImage(
	buffer: Buffer,
	publicId: string,
	options: PostMediaUploadOptions = {},
): Promise<string | null> {
	const configuration = getCloudinaryConfiguration()
	if (options.dryRun) {
		options.onLog?.('info', `[DRY RUN] 跳过 Cloudinary 上传: ${publicId}`)
		return null
	}
	if (!configuration.configured) {
		options.onLog?.(
			'error',
			`Cloudinary 未配置完整环境变量，无法上传 Post 图片: ${publicId}`,
		)
		return null
	}

	try {
		const result = await uploadCloudinaryImage(
			await optimizePostImage(buffer),
			publicId,
		)
		options.onLog?.(
			'info',
			`图片成功上传至 Cloudinary: ${publicId}`,
			result.secure_url,
		)
		return result.secure_url
	} catch (error) {
		options.onLog?.(
			'error',
			`Cloudinary 上传失败: ${publicId}`,
			error instanceof Error ? error.message : String(error),
		)
		return null
	}
}
