import type { Metadata } from 'next'
import { fetchContent } from '@/lib/content-providers'
import './globals.css'

import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderNav } from '@/components/HeaderNav'
import { cn } from '@/lib/utils'

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
			<body className={cn('min-h-screen antialiased')}>
				<main className="">
					<HeaderNav profile={profile} />
					<ScrollArea className="h-[calc(100vh-4rem)] overflow-y-auto">
						{children}
					</ScrollArea>
				</main>
			</body>
		</html>
	)
}
