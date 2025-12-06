import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'cdn.juice.site' },
			{ protocol: 'https', hostname: 'cloudinary.com' },
		],
	},
}

export default nextConfig
