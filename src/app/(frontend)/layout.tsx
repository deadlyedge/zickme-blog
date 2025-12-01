import { fetchContent } from '@/lib/content-providers'
import './globals.css'

import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderNav } from '@/components/Header'

export const metadata = {
	description:
		'Blog and resume driven by Payload and a typed Elysia content API.',
	title: 'Zick.me · Blog & Resume',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
	const { children } = props
	const data = await fetchContent()
	const { profile } = data

	return (
		<html lang="en">
			<body>
				<main className="min-h-screen bg-linear-to-b from-white via-slate-50 to-slate-50 text-slate-900 antialiased">
					<HeaderNav profile={profile} />
					<ScrollArea className="h-[calc(100vh-4rem)] overflow-y-auto">
						{children}
					</ScrollArea>
				</main>
			</body>
		</html>
	)
}
