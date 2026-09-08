'use client'

import { ExternalLinkIcon, FolderGit2Icon, StarIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GitHubIcon } from '@/components/ui/icons/social'
import type { FeaturedProject } from '@/types'

interface FeaturedProjectsSectionProps {
	projects?: FeaturedProject[] | null
}

export function FeaturedProjectsSection({
	projects,
}: FeaturedProjectsSectionProps) {
	const shouldReduceMotion = useReducedMotion()

	if (!projects || !Array.isArray(projects) || projects.length === 0) {
		return null
	}

	return (
		<section className="py-12 border-b border-border/40">
			<div className="space-y-3 mb-10">
				<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<FolderGit2Icon className="size-4" />
					<span>Open Source & Highlights</span>
				</div>
				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Featured Projects
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
					Selected applications, developer tools, and open source experiments
					I've built and maintained.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{projects.map((project, pIdx) => (
					<motion.div
						key={project.id || `feat-project-${pIdx}`}
						initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.4, delay: pIdx * 0.08 }}
						className="flex flex-col justify-between rounded-2xl bg-card border border-border/60 p-6 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
					>
						<div className="space-y-4">
							<div className="flex items-start justify-between gap-3">
								<h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
									{project.title}
								</h3>

								{project.stars && (
									<div className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
										<StarIcon className="size-3 fill-amber-500 text-amber-500" />
										<span>{project.stars}</span>
									</div>
								)}
							</div>

							<p className="text-sm text-muted-foreground leading-relaxed">
								{project.description}
							</p>

							{project.tags && project.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5 pt-1">
									{project.tags.map((tag) => (
										<Badge
											key={`proj-tag-${project.id || pIdx}-${tag}`}
											variant="secondary"
											className="text-[11px] font-mono px-2 py-0.5"
										>
											{tag}
										</Badge>
									))}
								</div>
							)}
						</div>

						{/* 底部外链动作 */}
						<div className="flex items-center gap-3 pt-6 mt-4 border-t border-border/40">
							{project.githubUrl && (
								<Button
									variant="ghost"
									size="sm"
									className="gap-2 text-xs"
									asChild
								>
									<a
										href={project.githubUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										<GitHubIcon size={14} />
										<span>GitHub</span>
									</a>
								</Button>
							)}

							{project.url && (
								<Button
									variant="outline"
									size="sm"
									className="gap-2 text-xs"
									asChild
								>
									<a
										href={project.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<ExternalLinkIcon className="size-3.5" />
										<span>Live Demo</span>
									</a>
								</Button>
							)}
						</div>
					</motion.div>
				))}
			</div>
		</section>
	)
}
