'use client'

import { useMemo, useState } from 'react'
import type { ProjectViewModel } from '@/lib/content-providers'
import { cn } from '@/lib/utils'
import { ButtonGroup } from './ui/button-group'
import { Button } from './ui/button'
import { ProjectCard } from './ProjectCard'

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
			p.technologies?.some((t) => t.name === active),
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
								: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
						)}>
						{c}
					</Button>
				))}
			</ButtonGroup>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{filtered.map((project) => (
					<ProjectCard key={project.id} project={project} />
				))}
			</div>
		</div>
	)
}
