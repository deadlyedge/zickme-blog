'use client'

import { Code2Icon, SparklesIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { CardTilt, CardTiltContent } from '@/components/ui/effects/CardTilt'
import type { Skill } from '@/types'

interface SkillsSectionProps {
	skills?: Skill[] | null
}

export function SkillsSection({ skills }: SkillsSectionProps) {
	const shouldReduceMotion = useReducedMotion()

	if (!skills || !Array.isArray(skills) || skills.length === 0) {
		return null
	}

	return (
		<section className="py-12 border-b border-border/40">
			<div className="space-y-3 mb-10">
				<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<Code2Icon className="size-4" />
					<span>Tech Stack & Tooling</span>
				</div>
				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Skills & Capabilities
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
					The languages, frameworks, systems, and architectural paradigms I rely
					on to build fast, robust, and delightful software.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{skills.map((skill, sIdx) => (
					<motion.div
						key={skill.category || `skill-cat-${sIdx}`}
						initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.4, delay: sIdx * 0.08 }}
					>
						<CardTilt tiltMaxAngle={10} scale={1.02} className="w-full">
							<CardTiltContent className="w-full h-full rounded-2xl bg-card border border-border/60 p-6 shadow-sm hover:shadow-md transition-shadow">
								<div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-border/50">
									<div className="flex items-center gap-2.5">
										<div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
											<SparklesIcon className="size-4" />
										</div>
										<h3 className="text-lg font-bold text-foreground">
											{skill.category}
										</h3>
									</div>
									<span className="text-xs font-mono text-muted-foreground">
										{skill.technologies?.length || 0} items
									</span>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{skill.technologies?.map((tech) => (
										<div
											key={tech.name}
											className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors"
										>
											<span className="text-sm font-semibold text-foreground">
												{tech.name}
											</span>
											{tech.level && (
												<span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-background text-muted-foreground border">
													{tech.level}
												</span>
											)}
										</div>
									))}
								</div>
							</CardTiltContent>
						</CardTilt>
					</motion.div>
				))}
			</div>
		</section>
	)
}
