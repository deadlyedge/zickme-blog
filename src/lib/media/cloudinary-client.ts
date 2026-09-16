import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY_ROOT_PATH } from '@/constants/cloudinary'

export interface CloudinaryConfiguration {
	configured: boolean
	baseUrl: string | null
}

export function getCloudinaryConfiguration(): CloudinaryConfiguration {
	const {
		CLOUDINARY_CLOUD_NAME: cloudName,
		CLOUDINARY_API_KEY: apiKey,
		CLOUDINARY_API_SECRET: apiSecret,
	} = process.env
	const configured = Boolean(cloudName && apiKey && apiSecret)
	if (!configured) return { configured: false, baseUrl: null }

	const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${CLOUDINARY_ROOT_PATH}`

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	})
	return {
		configured,
		baseUrl,
	}
}

export function getCloudinaryClient(): typeof cloudinary {
	if (!getCloudinaryConfiguration().configured)
		throw new Error(
			'Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET',
		)
	return cloudinary
}

export function getCloudinaryDeliveryBaseUrl(): string | null {
	return getCloudinaryConfiguration().baseUrl
}
