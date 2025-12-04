import ProjectClient from './ProjectClient'
import {
	fetchProjectBySlug,
	fetchAllProjectSlugs,
} from '@/lib/content-providers'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

export default async function ProjectPage({ params }: PageProps) {
	const { slug } = await params
	const project = await fetchProjectBySlug(slug)

	if (!project) {
		notFound()
	}

	return <ProjectClient initialProject={project} />
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params
	const project = await fetchProjectBySlug(slug)

	if (!project) {
		return {
			title: '项目未找到',
		}
	}

	return {
		title: project.title,
		description: project.description || `查看项目 ${project.title}`,
		openGraph: {
			title: project.title,
			description: project.description || `查看项目 ${project.title}`,
			images: project.images?.[0]?.url ? [{ url: project.images[0].url }] : [],
		},
	}
}

export async function generateStaticParams() {
	// 在开发模式下，为了避免缓存问题，暂时不预生成静态页面
	// 等生产环境时再启用
	if (process.env.NODE_ENV === 'development') {
		return []
	}

	const slugs = await fetchAllProjectSlugs()
	return slugs.map((slug) => ({
		slug,
	}))
}
