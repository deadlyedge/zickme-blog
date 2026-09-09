import type { Metadata } from 'next'
import {
	Funnel_Display,
	Noto_Sans,
	Noto_Sans_SC,
	Noto_Serif,
	Noto_Serif_SC,
	Source_Code_Pro,
} from 'next/font/google'
import './globals.css'

import AuthModal from '@/components/auth/AuthModal'
import { HeaderNav } from '@/components/HeaderNav'
import { QueryProvider } from '@/components/QueryProvider'
import { Toaster } from '@/components/ui/sonner'
import { fetchProfile } from '@/lib/content-providers'
import { generateDynamicThemeCss } from '@/lib/theme'

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

const sourceCodePro = Source_Code_Pro({
	variable: '--font-mono',
	subsets: ['latin'],
	weight: ['300'],
})

export const metadata: Metadata = {
	description:
		'Personal blog and portfolio website powered by Next.js, React 19, Bun, and Drizzle.',
	title: 'Zick.me · Blog & Portfolio',
	icons: {
		icon: [
			{ url: '/icon.svg', type: 'image/svg+xml' },
			{ url: '/favicon.ico', sizes: 'any' },
		],
		apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
	},
}

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: '#000',
}

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const profile = await fetchProfile()
	const dynamicThemeCss = generateDynamicThemeCss(profile?.themeConfig)

	return (
		<html lang="en">
			<body
				className={`${notoSans.variable} ${notoSansSC.variable} ${notoSerif.variable} ${notoSerifSC.variable} ${funnelDisplay.variable} ${sourceCodePro.variable} antialiased`}
			>
				{dynamicThemeCss && (
					<style
						id="dynamic-theme-style"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: dynamic theme injection from database
						dangerouslySetInnerHTML={{ __html: dynamicThemeCss }}
					/>
				)}
				<QueryProvider>
					<main>
						<HeaderNav />
						{children}
					</main>
					<AuthModal />
					<Toaster />
				</QueryProvider>
			</body>
		</html>
	)
}
