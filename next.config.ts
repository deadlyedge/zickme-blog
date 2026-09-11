import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: 'cdn.juice.site' },
			{ protocol: 'https', hostname: 'res.cloudinary.com' },
			{ protocol: 'https', hostname: 'images.unsplash.com' },
			{ protocol: 'https', hostname: 'gravatar.com' },
			{ protocol: 'https', hostname: 'c.zick.xyz' },
		],
	},
	async redirects() {
		return [
			{
				source: '/blog',
				destination: '/posts',
				permanent: true,
			},
			{
				source: '/blog/:slug',
				destination: '/posts/:slug',
				permanent: true,
			},
			{
				source: '/projects',
				destination: '/posts',
				permanent: true,
			},
			{
				source: '/projects/:slug',
				destination: '/posts/:slug',
				permanent: true,
			},
		]
	},
}

export default nextConfig
