import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
	GlobeIcon,
	MailIcon,
	GithubIcon,
	LinkedinIcon,
	TwitterIcon,
	InstagramIcon,
	YoutubeIcon,
	FacebookIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { SiteProfile, SocialLink } from '@/types'
import type React from 'react'
import Link from 'next/link'

type FooterAboutProps = {
	profileData: SiteProfile | null
}

type AnimatedContainerProps = React.ComponentProps<typeof motion.div> & {
	children?: React.ReactNode
	delay?: number
}

function AnimatedContainer({
	delay = 0.5,
	children,
	...props
}: AnimatedContainerProps) {
	const shouldReduceMotion = useReducedMotion()

	if (shouldReduceMotion) {
		return children
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -20, opacity: 0 }}
			transition={{ delay, duration: 0.8 }}
			viewport={{ once: false }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			{...props}>
			{children}
		</motion.div>
	)
}

function getSocialIcon(platform: string) {
	switch (platform) {
		case 'GitHub':
			return GithubIcon
		case 'LinkedIn':
			return LinkedinIcon
		case 'Twitter':
			return TwitterIcon
		case 'Instagram':
			return InstagramIcon
		case 'YouTube':
			return YoutubeIcon
		case 'Facebook':
			return FacebookIcon
		default:
			return null
	}
}

export function FooterAbout({ profileData }: FooterAboutProps) {
	// const profileData = await fetchProfile()

	if (!profileData) {
		return <div>暂无个人资料</div>
	}

	return (
		<footer
			className="relative h-140 w-full border-t mt-24 pt-24"
			style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}>
			<div className="fixed bottom-0 left-0 h-140 w-full pointer-events-none isolate">
				<div className="sticky top-[calc(100vh-560px)] h-full pointer-events-none">
					<div className="grid grid-cols-1 gap-12 pt-12 sm:grid-cols-4 max-w-7xl mx-auto px-4">
						<AnimatedContainer className="space-y-4 sm:col-start-2">
							<div className="mt-8 sm:mt-0">
								{profileData.avatar && (
									<Image
										src={profileData.avatar || ''}
										alt={profileData.name}
										width={300}
										height={300}
										className="rounded-lg"
									/>
								)}
							</div>
						</AnimatedContainer>
						<AnimatedContainer className="space-y-4 sm:col-span-2" delay={0.1}>
							<h1 className="text-4xl font-bold mb-4">{profileData.name}</h1>
							<p className="text-xl text-muted-foreground mb-6">
								{profileData.title}
							</p>
							<p className="text-lg mb-6">{profileData.bio}</p>

							{profileData.location && (
								<p className="mb-2">📍 {profileData.location}</p>
							)}

							<div className="inline-block pointer-events-auto">
								{profileData.email && (
									<p className="mb-2 flex gap-1">
										<MailIcon />
										{profileData.email}
									</p>
								)}

								{profileData.website && (
									<p className="mb-6 flex gap-1">
										<GlobeIcon />
										<a
											href={profileData.website}
											className="text-primary hover:underline">
											{profileData.website}
										</a>
									</p>
								)}

								{profileData.socialLinks &&
									Array.isArray(profileData.socialLinks) && (
										<div className="flex gap-2">
											{(profileData.socialLinks as SocialLink[]).map(
												(link, index: number) => {
													const IconComponent = getSocialIcon(link.platform)
													return IconComponent ? (
														<Button
															key={`social-${link.url}-${index}`}
															size="icon-sm"
															variant="outline"
															asChild>
															<a
																href={link.url}
																target="_blank"
																rel="noopener noreferrer">
																<IconComponent className="size-4" />
															</a>
														</Button>
													) : null
												},
											)}
											<Button size="sm" variant="outline" asChild>
												<Link href="/privacy">
													Privacy
												</Link>
											</Button>
											<Button size="sm" variant="outline" asChild>
												<Link href="/terms-of-service">
													Terms of service
												</Link>
											</Button>
										</div>
									)}
							</div>
							<div className="flex items-center pb-24 gap-4 border-t py-4 text-muted-foreground text-sm sm:flex-row">
								<p>&copy; 2025 xdream, All rights reserved.</p>
							</div>
						</AnimatedContainer>
					</div>
				</div>
			</div>
		</footer>
	)
}
