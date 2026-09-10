'use client'

import { GlobeIcon, MailIcon, MessageSquareHeartIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSocialIcon } from '@/components/ui/icons/social'
import type { SiteProfile, SocialLink } from '@/types'

interface ContactCardsSectionProps {
	profile: SiteProfile
}

export function ContactCardsSection({ profile }: ContactCardsSectionProps) {
	const shouldReduceMotion = useReducedMotion()

	return (
		<section className="py-12">
			<div className="mb-8 space-y-2">
				<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<MessageSquareHeartIcon className="size-4" />
					<span>Let's Connect</span>
				</div>
				<h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
					Get in Touch
				</h2>
			</div>

			<motion.div
				initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.4 }}
				className="inline-block space-y-4"
			>
				{profile.email && (
					<a
						href={`mailto:${profile.email}`}
						className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<MailIcon className="size-4" />
						<span>{profile.email}</span>
					</a>
				)}

				{profile.website && (
					<a
						href={profile.website}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 text-sm text-primary transition-colors hover:underline"
					>
						<GlobeIcon className="size-4 text-muted-foreground" />
						<span>{profile.website}</span>
					</a>
				)}

				{profile.socialLinks && Array.isArray(profile.socialLinks) && (
					<div className="flex flex-wrap gap-2">
						{(profile.socialLinks as SocialLink[]).map((link) => {
							const Icon = getSocialIcon(link.platform)
							return Icon ? (
								<Button
									key={`contact-social-${link.platform}-${link.url}`}
									size="icon-sm"
									variant="outline"
									asChild
									title={link.platform}
								>
									<a href={link.url} target="_blank" rel="noopener noreferrer">
										<Icon className="size-4" />
									</a>
								</Button>
							) : null
						})}
					</div>
				)}
			</motion.div>

			{/* 底部站点版权与条款快捷入口 */}
			<div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
				<p>
					&copy; {new Date().getFullYear()} {profile.name}. All rights reserved.
				</p>
				<div className="flex items-center gap-4 font-medium">
					<Link
						href="/privacy"
						className="hover:text-foreground transition-colors"
					>
						Privacy Policy
					</Link>
					<span>•</span>
					<Link
						href="/terms-of-service"
						className="hover:text-foreground transition-colors"
					>
						Terms of Service
					</Link>
					<span>•</span>
					<Link
						href="/posts"
						className="hover:text-foreground transition-colors"
					>
						Explore Posts
					</Link>
				</div>
			</div>
		</section>
	)
}
