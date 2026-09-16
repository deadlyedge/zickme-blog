import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

const MAX_IMAGE_WIDTH = 3840
const MAX_IMAGE_HEIGHT = 2160
// The Cloudinary account already applies the `myblog` root folder.
export const POST_CLOUDINARY_PUBLIC_ID_PREFIX = 'posts'
const DEFAULT_CLOUDINARY_BASE_URL =
	'https://res.cloudinary.com/zickme-blog/image/upload/myblog/'

export interface PostMediaUploadOptions {
	dryRun?: boolean
	onLog?: (
		level: 'info' | 'warn' | 'error',
		message: string,
		detail?: string,
	) => void
}

function configureCloudinary(): {
	configured: boolean
	baseUrl: string
} {
	const {
		CLOUDINARY_CLOUD_NAME: cloudName,
		CLOUDINARY_API_KEY: apiKey,
		CLOUDINARY_API_SECRET: apiSecret,
	} = process.env
	if (!cloudName || !apiKey || !apiSecret)
		return { configured: false, baseUrl: DEFAULT_CLOUDINARY_BASE_URL }

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	})
	return {
		configured: true,
		baseUrl: `https://res.cloudinary.com/${cloudName}/image/upload/myblog/`,
	}
}

export function getPostMediaBaseUrl(): string {
	return configureCloudinary().baseUrl
}

function sanitizePublicIdSegment(value: string): string {
	return value
		.normalize('NFKC')
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

export function buildPostMediaPublicId(
	postSlug: string,
	imagePath: string,
): string {
	const safePostSlug = sanitizePublicIdSegment(postSlug)
	const imageName = imagePath.split(/[\\/]/).pop() ?? imagePath
	const safeImageName = sanitizePublicIdSegment(
		imageName.replace(/\.[^/.]+$/, ''),
	)
	if (!safePostSlug || !safeImageName)
		throw new Error(`Invalid Post media public ID: ${postSlug}/${imagePath}`)
	return `${POST_CLOUDINARY_PUBLIC_ID_PREFIX}/${safePostSlug}/${safeImageName}`
}

async function optimizePostImage(inputBuffer: Buffer): Promise<Buffer> {
	return sharp(inputBuffer)
		.resize({
			width: MAX_IMAGE_WIDTH,
			height: MAX_IMAGE_HEIGHT,
			fit: 'inside',
			withoutEnlargement: true,
		})
		.webp({ quality: 85, effort: 4 })
		.toBuffer()
}

/** Upload Post media without allowing dry-run to contact Cloudinary. */
export async function uploadPostImage(
	buffer: Buffer,
	publicId: string,
	options: PostMediaUploadOptions = {},
): Promise<string | null> {
	const normalizedId = publicId
		.split('/')
		.map(sanitizePublicIdSegment)
		.filter(Boolean)
		.join('/')
	const { configured, baseUrl } = configureCloudinary()

	if (options.dryRun) {
		options.onLog?.('info', `[DRY RUN] 跳过 Cloudinary 上传: ${normalizedId}`)
		return null
	}
	if (!configured) {
		options.onLog?.(
			'warn',
			`Cloudinary 未配置环境变量，跳过远程上传: ${normalizedId}`,
		)
		return `${baseUrl}${normalizedId}`
	}

	try {
		const optimized = await optimizePostImage(buffer)
		return await new Promise((resolve) => {
			const stream = cloudinary.uploader.upload_stream(
				{
					public_id: normalizedId,
					resource_type: 'image',
					overwrite: true,
				},
				(error, result) => {
					if (error || !result) {
						options.onLog?.(
							'error',
							`Cloudinary 上传失败: ${normalizedId}`,
							error?.message,
						)
						resolve(null)
					} else {
						options.onLog?.(
							'info',
							`图片成功上传至 Cloudinary: ${normalizedId}`,
							result.secure_url,
						)
						resolve(result.secure_url)
					}
				},
			)
			stream.end(optimized)
		})
	} catch (error) {
		options.onLog?.(
			'error',
			`处理图片异常: ${normalizedId}`,
			error instanceof Error ? error.message : String(error),
		)
		return null
	}
}
