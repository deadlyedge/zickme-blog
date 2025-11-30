export function generateMetadata({
	title,
	description,
	image,
	url,
}: {
	title: string
	description?: string
	image?: string
	url?: string
}) {
	const siteName = 'Your Name - Personal Blog'
	const defaultDescription = 'Personal blog and portfolio website'

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
