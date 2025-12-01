import { Header } from '@/components/Header'
import './globals.css'
import { fetchContent } from '@/lib/content-providers'
import { ScrollArea } from '@/components/ui/scroll-area'

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
					<Header profile={profile} />
					<ScrollArea className="h-[calc(100vh-4rem)] overflow-y-auto">{children}</ScrollArea>
				</main>
			</body>
		</html>
	)
}
