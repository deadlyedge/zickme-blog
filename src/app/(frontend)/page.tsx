import { fetchContent } from '@/lib/content-providers'
// import Link from 'next/link'
// import Image from 'next/image'
// import { formatPublishedDate } from '@/lib/utils'
// import { Hero } from '@/components/Hero'
// import MotionTest from '@/components/MotionTest'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { HomeScrollArea } from '@/components/HomeScrollArea'

// 每5分钟重新验证一次，确保内容及时更新
export const revalidate = 300

export default async function HomePage() {
	const data = await fetchContent()
	// const { profile, projects, blogPosts } = data

	return <HomeScrollArea data={data} />
}
