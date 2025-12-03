import Link from 'next/link'
import Image from 'next/image'

import { CardTilt, CardTiltContent } from './ui/effects/CardTilt'
import { Badge } from './ui/badge'
import { ProjectViewModel } from '@/lib/content-providers'
import { formatPublishedDate } from '@/lib/utils'

type ProjectCardProps = { project: ProjectViewModel }

export const ProjectCard = ({ project }: ProjectCardProps) => {
	return (
		<CardTilt
			key={project.slug}
			aria-labelledby={`project-${project.title}`}
			className=""
			tiltMaxAngle={15}
			scale={1.05}>
			<CardTiltContent className="rounded-2xl bg-card shadow-2xl overflow-hidden">
				<div className="relative bg-slate-100">
					<Link href={`/projects/${project.slug}`}>
						{project.images?.[0]?.url ? (
							<div className="relative w-full aspect-4/3 bg-slate-100">
								<Image
									src={project.images[0].url || ''}
									alt={project.title}
									fill
									sizes="(max-width: 700px) 100vw, (max-width: 1024px) 50vw, 33vw"
									className="object-cover"
								/>
							</div>
						) : (
							<div className="h-80 flex items-center justify-center text-slate-400">
								No image
							</div>
						)}
					</Link>
					<div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
					<div className="absolute left-6 bottom-6 pointer-events-none">
						<span className="text-xl font-bold text-gray-50 drop-shadow-[0px_0px_13px_rgba(255,243,184,0.8)]">
							{project.title}
						</span>
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

				<div className="p-6 bg-card">
					<p className="text-sm line-clamp-3">{project.description}</p>

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
			</CardTiltContent>
		</CardTilt>
	)
}
