import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Allow external image hosts used by references (e.g. juice site CDN).
	// You can add more domains if you use images from other CDNs.
	images: {
		remotePatterns: [{ protocol: 'https', hostname: 'cdn.juice.site' }],
		// Keep unoptimized false to enable Next.js optimizations in supported envs.
		// In development with relative /api/media URLs next/image will still work.
	},
}

export default nextConfig
