'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ProjectViewModel } from '@/lib/content-providers'
import { Badge } from './ui/badge'
import { cn, formatPublishedDate } from '@/lib/utils'
import { ButtonGroup } from './ui/button-group'
import { Button } from './ui/button'

type Props = {
	projects: ProjectViewModel[]
}

/**
 * Client-side Projects grid with filter UI.
 * - Derives filter categories from technologies + "Featured"
 * - Single-select filter (like juice.agency)
 * - Smooth hover / transition styles using Tailwind utilities
 */
export default function ProjectsGridClient({ projects }: Props) {
	const [active, setActive] = useState<string>('All')

	const categories = useMemo(() => {
		const techs = new Set<string>()
		projects.forEach((p) => {
			p.technologies?.forEach((t) => {
				if (t?.name) techs.add(t.name)
			})
		})
		return ['All', 'Featured', ...Array.from(techs)]
	}, [projects])

	const filtered = useMemo(() => {
		if (active === 'All') return projects
		if (active === 'Featured') return projects.filter((p) => !!p.featured)
		return projects.filter((p) =>
			p.technologies?.some((t) => t.name === active)
		)
	}, [projects, active])

	return (
		<div>
			<ButtonGroup className="mb-4 flex-wrap space-y-2">
				{categories.map((c) => (
					<Button
						key={c}
						onClick={() => setActive(c)}
						aria-pressed={active === c}
						aria-label={`Filter by ${c}`}
						className={cn(
							'transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ',
							active === c
								? 'bg-amber-600 text-white shadow-lg'
								: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
						)}>
						{c}
					</Button>
				))}
			</ButtonGroup>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{filtered.map((project) => (
					<article
						key={project.title}
						role="article"
						tabIndex={0}
						aria-labelledby={`project-${project.title}`}
						className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
						<div className="relative h-80 bg-slate-100">
							{project.images?.[0]?.url ? (
								<Image
									src={project.images[0].url || ''}
									alt={project.title}
									fill
									sizes="(min-width: 1024px) 400px, 100vw"
									className="object-cover group-hover:scale-105 transition-transform duration-500"
								/>
							) : (
								<div className="h-80 flex items-center justify-center text-slate-400">
									No image
								</div>
							)}
							<div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
							<div className="absolute left-6 bottom-6">
								<Link
									href={`/projects/${project.slug}`}
									className="text-lg font-semibold text-white hover:underline">
									{project.title}
								</Link>
								<div className="mt-2 flex flex-wrap gap-1">
									{project.technologies?.slice(0, 3).map((t) => (
										<Badge
											key={t.name}
											className="bg-amber-50 text-amber-700 border border-amber-100">
											{t.name}
										</Badge>
									))}
								</div>
							</div>
						</div>

						<div className="p-6 bg-white">
							<p className="text-sm text-slate-600 line-clamp-3">
								{project.description}
							</p>

							<div className="mt-4 flex items-center justify-between text-xs text-slate-500">
								<div>
									{project.startDate && formatPublishedDate(project.startDate)}
								</div>
								<div className="flex items-center gap-3">
									{project.demoUrl && (
										<a
											href={project.demoUrl}
											target="_blank"
											rel="noreferrer"
											className="hover:underline">
											Demo
										</a>
									)}
									{project.sourceUrl && (
										<a
											href={project.sourceUrl}
											target="_blank"
											rel="noreferrer"
											className="hover:underline">
											Source
										</a>
									)}
								</div>
							</div>
						</div>
					</article>
				))}
			</div>
		</div>
	)
}
