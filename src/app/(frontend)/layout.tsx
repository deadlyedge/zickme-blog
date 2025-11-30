import { Header } from '@/components/Header'
import './globals.css'
import { fetchContent } from '@/lib/content-providers'

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
				<main>
					<Header profile={profile} />
					{children}
				</main>
			</body>
		</html>
	)
}
