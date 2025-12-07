// import { fetchProjects } from '@/lib/content-providers'
// import { buildMetadata } from '@/lib/seo'
// import { Metadata } from 'next'
// // import Link from 'next/link'
// import Image from 'next/image'
// import ProjectsGridClient from '../../components/ProjectsGridClient'
// import { formatPublishedDate } from '@/lib/utils'
// import { Badge } from '@/components/ui/badge'

/**
 * Strict visual refactor of Projects page to match juice.agency/work
 * - Uses page-local Tailwind utilities only (no config changes)
 * - Large hero, prominent featured case, dense image-first grid
 * - Titles over images, soft gradient overlays, strong spacing rhythm
 */

export const revalidate = 3600 // 每小时重新验证一次

// export const metadata: Metadata = buildMetadata({
// 	title: 'Projects',
// 	description: 'Selected case studies and project highlights — built with craft, clarity and measurable outcomes.',
// })

export default async function ProjectsPage() {
	return <div className="pt-16 overflow-y-auto h-svh">hello Project </div>
}
