'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getSocialIcon } from '@/components/ui/icons/social'
import type { AboutPageConfig, SiteProfile, SocialLink } from '@/types'

interface AboutHeroProps {
	profile: SiteProfile
	aboutConfig?: AboutPageConfig | null
}

export function AboutHero({ profile, aboutConfig }: AboutHeroProps) {
	const shouldReduceMotion = useReducedMotion()

	const headline =
		aboutConfig?.headline ||
		`Hi, I'm ${profile.name} — ${profile.title || 'Software Engineer'}.`
	const subheadline = aboutConfig?.subheadline || profile.bio
	const statusText =
		aboutConfig?.statusText ||
		(profile.location
			? `Based in ${profile.location}`
			: 'Available for new opportunities')

	return (
		<section className="relative pt-6 pb-12 border-b border-border/40">
			<div className="flex flex-col-reverse md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">
				{/* 文本区域 */}
				<motion.div
					initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="flex-1 space-y-5"
				>
					{/* 在线状态 Badge */}
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
						</span>
						<span>{statusText}</span>
					</div>

					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
						{headline}
					</h1>

					<p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
						{subheadline}
					</p>

					{/* 社交平台快捷导航与 CTA */}
					<div className="flex flex-wrap items-center gap-3 pt-2">
						{profile.socialLinks &&
							Array.isArray(profile.socialLinks) &&
							(profile.socialLinks as SocialLink[]).map((link) => {
								const Icon = getSocialIcon(link.platform)
								return Icon ? (
									<Button
										key={`hero-social-${link.platform}-${link.url}`}
										variant="outline"
										size="sm"
										className="gap-2 text-xs font-semibold"
										asChild
									>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											title={link.platform}
										>
											<Icon className="size-4" />
											<span>{link.platform}</span>
										</a>
									</Button>
								) : null
							})}

						{profile.email && (
							<Button size="sm" asChild className="gap-2 text-xs font-semibold">
								<a href={`mailto:${profile.email}`}>Get in touch</a>
							</Button>
						)}
					</div>
				</motion.div>

				{/* 头像区域 */}
				{profile.avatar && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="relative shrink-0"
					>
						<div className="relative size-32 sm:size-44 md:size-52 rounded-2xl p-1.5 bg-linear-to-tr from-primary/30 via-primary/10 to-transparent border shadow-xl overflow-hidden group">
							<Image
								src={profile.avatar}
								alt={profile.name}
								fill
								sizes="(max-width: 639px) 128px, (max-width: 767px) 176px, 208px"
								className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
								priority
							/>
						</div>
					</motion.div>
				)}
			</div>
		</section>
	)
}
