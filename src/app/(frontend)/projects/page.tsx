import { fetchProjects } from '@/lib/content-providers'
// import Link from 'next/link'
import Image from 'next/image'
import ProjectsGridClient from '../../../components/ProjectsGridClient'
import { formatPublishedDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/**
 * Strict visual refactor of Projects page to match juice.agency/work
 * - Uses page-local Tailwind utilities only (no config changes)
 * - Large hero, prominent featured case, dense image-first grid
 * - Titles over images, soft gradient overlays, strong spacing rhythm
 */

export const revalidate = 3600 // 每小时重新验证一次

export default async function ProjectsPage() {
	const projects = await fetchProjects()

	if (!projects || projects.length === 0) {
		return (
			<main className="min-h-screen bg-white text-slate-900">
				<div className="mx-auto max-w-6xl px-6 py-24">
					<h1 className="text-4xl font-extrabold">Work</h1>
					<p className="mt-6 text-slate-600">No projects yet.</p>
				</div>
			</main>
		)
	}

	const featured = projects.find((p) => p.featured) ?? projects[0]
	// const others = projects.filter((p) => p !== featured)

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			{/* HERO */}
			<section className="mx-auto max-w-7xl p-6">
				<div className="max-w-3xl">
					<h1 className="text-6xl font-extrabold leading-tight">Projects</h1>
					<p className="mt-6 text-xl text-slate-600">
						Selected case studies and project highlights — built with craft,
						clarity and measurable outcomes.
					</p>
				</div>
			</section>

			{/* FEATURED */}
			<section className="mx-auto max-w-7xl px-6 pb-16">
				<div className="grid lg:grid-cols-12 gap-8 items-center">
					<div className="lg:col-span-8 order-2 lg:order-1">
						<div className="relative rounded-3xl overflow-hidden shadow-2xl">
							{featured.images[0]?.url ? (
								<div className="relative w-full aspect-video bg-slate-100">
									<Image
										src={featured.images[0].url}
										alt={featured.title}
										fill
										sizes="(max-width: 700px) 100vw, 80vw"
										className="object-cover"
									/>
									<div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />
								</div>
							) : (
								<div className="w-full aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
									No image
								</div>
							)}
						</div>
					</div>

					<div className="lg:col-span-4 order-1 lg:order-2">
						<div className="space-y-6">
							<p className="text-xs uppercase text-slate-500">Featured case</p>
							<h2 className="text-3xl font-extrabold">{featured.title}</h2>
							<p className="text-slate-600">{featured.description}</p>

							<div className="flex flex-wrap gap-3">
								{featured.technologies?.map((t) => (
									<Badge
										key={t.name}
										className="bg-amber-50 text-amber-700 border-amber-100">
										{t.name}
									</Badge>
								))}
							</div>

							<div className="flex items-center gap-3">
								{featured.demoUrl && (
									<a
										href={featured.demoUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700 transition">
										View demo
									</a>
								)}
								{featured.sourceUrl && (
									<a
										href={featured.sourceUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
										Source
									</a>
								)}
								<span className="text-sm text-slate-500">
									{featured.startDate
										? formatPublishedDate(featured.startDate)
										: ''}
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* GRID: image-first, titles overlaid (juice-like) */}
			<section className="mx-auto max-w-7xl px-6 pb-32">
				<ProjectsGridClient projects={projects} />
			</section>
		</div>
	)
}
