import type { Metadata } from 'next'
import { fetchContent } from '@/lib/content-providers'
import './globals.css'

import { HeaderNav } from '@/components/HeaderNav'
import { Funnel_Display, Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'

const notoSans = Noto_Sans_SC({
	variable: '--font-noto-sans-sc',
	subsets: ['latin'],
	weight: ['400'],
})

const notoSerifSC = Noto_Serif_SC({
	variable: '--font-noto-serif-sc',
	subsets: ['latin'],
	weight: ['400'],
})

const funnelDisplay = Funnel_Display({
	variable: '--font-funnel',
	subsets: ['latin'],
	weight: ['300', '600', '800'],
})

export const metadata: Metadata = {
	description:
		'Blog and resume driven by Payload and a typed Elysia content API.',
	title: 'Zick.me · Blog & Resume',
}

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: '#000',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
	const { children } = props
	const data = await fetchContent()
	const { profile } = data

	return (
		<html lang="en">
			<body
				className={`${notoSans.variable} ${notoSerifSC.variable} ${funnelDisplay.variable} antialiased`}>
				<main className="">
					<HeaderNav profile={profile} />
					{children}
				</main>
			</body>
		</html>
	)
}
