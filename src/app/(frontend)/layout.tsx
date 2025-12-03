import {
	Funnel_Display,
	Noto_Sans,
	Noto_Sans_SC,
	Noto_Serif,
	Noto_Serif_SC,
} from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'

import { HeaderNav } from '@/components/HeaderNav'
import { Providers } from '@/components/providers'

const notoSerif = Noto_Serif({
	variable: '--font-noto-serif',
	subsets: ['latin'],
})

const notoSans = Noto_Sans({
	variable: '--font-noto-sans',
	subsets: ['latin'],
	weight: ['400'],
})

const notoSerifSC = Noto_Serif_SC({
	variable: '--font-noto-serif-sc',
	subsets: ['latin'],
	weight: ['400', '800'],
})
const notoSansSC = Noto_Sans_SC({
	variable: '--font-noto-sans-sc',
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

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body
				className={`${notoSans.variable} ${notoSansSC.variable} ${notoSerif.variable} ${notoSerifSC.variable} ${funnelDisplay.variable} antialiased`}>
				<Providers>
					<main className="">
						<HeaderNav />
						{children}
					</main>
				</Providers>
			</body>
		</html>
	)
}
