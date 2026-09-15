import type { Metadata } from 'next'
import { SITE_DESCRIPTION, SITE_NAME } from '@/constants/site'

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
	const pageTitle = `${title} | ${SITE_NAME}`
	const desc = description || SITE_DESCRIPTION
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
			siteName: SITE_NAME,
			images: image ? [{ url: image }] : [],
			type: 'website',
		},
		alternates: url ? { canonical: url } : undefined,
		twitter: {
			card: 'summary_large_image',
			title: pageTitle,
			description: desc,
			images: image ? [image] : [],
		},
	}
}
