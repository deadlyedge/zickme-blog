import { fetchHomeContent } from '@/lib/content-providers'
import { HomeScrollArea } from '@/components/HomeScrollArea'

export const revalidate = 3600 // 每小时重新验证一次，确保内容及时更新

export default async function HomePage() {
	const data = await fetchHomeContent()

	return <HomeScrollArea data={data} />
}
