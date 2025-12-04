import type { Metadata } from 'next'

export const siteName = 'xdream - Blog'
export const defaultDescription = 'Personal blog and portfolio website'

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
	return {
		title: `${title} | ${siteName}`,
		description: description || defaultDescription,
		openGraph: {
			title: `${title} | ${siteName}`,
			description: description || defaultDescription,
			url,
			siteName,
			images: image ? [{ url: image }] : [],
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: `${title} | ${siteName}`,
			description: description || defaultDescription,
			images: image ? [image] : [],
		},
	}
}
