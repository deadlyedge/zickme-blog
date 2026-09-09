import type { Metadata } from 'next'

export const siteName = 'Zick.me'
export const defaultDescription =
	'Zick.me · Modern Personal Blog & Portfolio built with Next.js, Bun, and Drizzle'

export function buildMetadata({
	title,
	description,
	image,
	url,
}: {
	title: string
	description?: string
	image?: string
	url?: string
}): Metadata {
	const pageTitle = `${title} | ${siteName}`
	const desc = description || defaultDescription
	return {
		title: pageTitle,
		description: desc,
		icons: {
			icon: [
				{ url: '/icon.svg', type: 'image/svg+xml' },
				{ url: '/favicon.ico', sizes: 'any' },
			],
			apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
		},
		openGraph: {
			title: pageTitle,
			description: desc,
			url,
			siteName,
			images: image ? [{ url: image }] : [],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: pageTitle,
			description: desc,
			images: image ? [image] : [],
		},
	}
}
