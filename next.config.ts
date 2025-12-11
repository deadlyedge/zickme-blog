import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'cdn.juice.site' },
			{ protocol: 'https', hostname: 'res.cloudinary.com' },
			{ protocol: 'https', hostname: 'gravatar.com' },
			{ protocol: 'https', hostname: 'c.zick.xyz' },
		],
	},
}

export default nextConfig
