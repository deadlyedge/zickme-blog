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
			<div className="space-y-3 mb-10">
				<div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
					<MessageSquareHeartIcon className="size-4" />
					<span>Let's Connect</span>
				</div>
				<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Get in Touch
				</h2>
				<p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
					Whether you have a question, want to collaborate on open source, or
					just want to say hi — my inbox is always open.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* 邮箱直接联系卡片 */}
				{profile.email && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.4 }}
						className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
					>
						<div className="space-y-3">
							<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
								<MailIcon className="size-5" />
							</div>
							<h3 className="text-base font-bold text-foreground">Email</h3>
							<p className="text-xs text-muted-foreground break-all">
								{profile.email}
							</p>
						</div>

						<div className="pt-6 mt-2">
							<Button
								size="sm"
								className="w-full text-xs font-semibold"
								asChild
							>
								<a href={`mailto:${profile.email}`}>Send an Email</a>
							</Button>
						</div>
					</motion.div>
				)}

				{/* 个人主页/站点卡片 */}
				{profile.website && (
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.4, delay: 0.08 }}
						className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
					>
						<div className="space-y-3">
							<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
								<GlobeIcon className="size-5" />
							</div>
							<h3 className="text-base font-bold text-foreground">Website</h3>
							<p className="text-xs text-muted-foreground break-all">
								{profile.website}
							</p>
						</div>

						<div className="pt-6 mt-2">
							<Button
								variant="outline"
								size="sm"
								className="w-full text-xs font-semibold"
								asChild
							>
								<a
									href={profile.website}
									target="_blank"
									rel="noopener noreferrer"
								>
									Visit Website
								</a>
							</Button>
						</div>
					</motion.div>
				)}

				{/* 社交媒体综合网格卡片 */}
				<motion.div
					initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.4, delay: 0.16 }}
					className="flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
				>
					<div className="space-y-3">
						<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
							<MessageSquareHeartIcon className="size-5" />
						</div>
						<h3 className="text-base font-bold text-foreground">
							Social Networks
						</h3>
						<p className="text-xs text-muted-foreground">
							Follow and reach out across digital platforms.
						</p>
					</div>

					<div className="flex flex-wrap gap-2 pt-6 mt-2">
						{profile.socialLinks &&
							Array.isArray(profile.socialLinks) &&
							(profile.socialLinks as SocialLink[]).map((link) => {
								const Icon = getSocialIcon(link.platform)
								return Icon ? (
									<Button
										key={`contact-social-${link.platform}-${link.url}`}
										size="icon-sm"
										variant="outline"
										asChild
										className="hover:border-primary hover:text-primary transition-colors"
									>
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											title={link.platform}
										>
											<Icon className="size-4" />
										</a>
									</Button>
								) : null
							})}
					</div>
				</motion.div>
			</div>

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
