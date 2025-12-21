import type { Metadata } from 'next'
import { HomeScrollArea } from '@/components/HomeScrollArea'
import { fetchHomeContent } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600 // 每小时重新验证一次，确保内容及时更新

export const metadata: Metadata = buildMetadata({
	title: 'Zickme Home',
	description: 'Welcome to my personal blog and portfolio website.',
})

export default async function HomePage() {
	const data = await fetchHomeContent()

	return <HomeScrollArea data={data} />
}
