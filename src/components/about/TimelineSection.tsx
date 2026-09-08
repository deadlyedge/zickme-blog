'use client'

import {
	BriefcaseIcon,
	CalendarIcon,
	ExternalLinkIcon,
	MapPinIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import type { TimelineItem } from '@/types'

interface TimelineSectionProps {
	title?: string
	description?: string
	items?: TimelineItem[]
	emptyFallback?: TimelineItem[]
}

export function TimelineSection({
	title = 'Work & Career Experience',
	description = 'A chronological journey through my professional engineering roles, leadership, and notable contributions.',
	items,
	emptyFallback = [],
}: TimelineSectionProps) {
	const shouldReduceMotion = useReducedMotion()
	const displayItems = items && items.length > 0 ? items : emptyFallback

	if (displayItems.length === 0) {
		return null
	}

	return (
		<section className="py-12 border-b border-border/40">
			<div className="space-y-3 mb-10">
				<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<BriefcaseIcon className="size-4" />
					<span>Experience & Journey</span>
				</div>
				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					{title}
				</h2>
				{description && (
					<p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
						{description}
					</p>
				)}
			</div>

			{/* Timeline 流水线容器 */}
			<div className="relative pl-6 sm:pl-8 border-l-2 border-border/60 ml-2 sm:ml-4 space-y-10">
				{displayItems.map((item, idx) => (
					<motion.div
						key={item.id || `timeline-${item.company}-${item.period}`}
						initial={shouldReduceMotion ? false : { opacity: 0, x: -16 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ duration: 0.4, delay: idx * 0.08 }}
						className="relative group"
					>
						{/* 时间线圆点指示器 */}
						<div className="absolute -left-7.75 sm:-left-9.75 top-1.5 size-3.5 sm:size-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary group-hover:scale-125 transition-all duration-300 ring-4 ring-background" />

						<div className="space-y-3">
							{/* 顶部时期与地点 */}
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
										{item.role}
									</h3>
									<span className="text-muted-foreground font-semibold">@</span>
									{item.companyUrl ? (
										<a
											href={item.companyUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary underline-offset-4 hover:underline"
										>
											{item.company}
											<ExternalLinkIcon className="size-3.5" />
										</a>
									) : (
										<span className="font-semibold text-foreground">
											{item.company}
										</span>
									)}
								</div>

								<div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
									{item.location && (
										<span className="inline-flex items-center gap-1">
											<MapPinIcon className="size-3.5" />
											{item.location}
										</span>
									)}
									<span className="inline-flex items-center gap-1 bg-muted px-2.5 py-0.5 rounded-md font-mono text-xs">
										<CalendarIcon className="size-3" />
										{item.period}
									</span>
								</div>
							</div>

							{/* 描述文本 */}
							{item.description && (
								<p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
									{item.description}
								</p>
							)}

							{/* 重点亮点列表 (Achievements) */}
							{item.achievements && item.achievements.length > 0 && (
								<ul className="space-y-1.5 pt-1 text-xs sm:text-sm text-foreground/80 list-disc list-outside pl-4 marker:text-primary">
									{item.achievements.map((ach) => (
										<li key={`ach-${item.id || item.company}-${ach}`}>{ach}</li>
									))}
								</ul>
							)}

							{/* 技术标签列表 (Technologies) */}
							{item.technologies && item.technologies.length > 0 && (
								<div className="flex flex-wrap gap-1.5 pt-2">
									{item.technologies.map((tech) => (
										<Badge
											key={`tech-${item.id || item.company}-${tech}`}
											variant="secondary"
											className="text-[11px] font-medium px-2 py-0.5 hover:bg-primary/20 transition-colors"
										>
											{tech}
										</Badge>
									))}
								</div>
							)}
						</div>
					</motion.div>
				))}
			</div>
		</section>
	)
}
