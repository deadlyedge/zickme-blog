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
import { SiteProfileExtended } from '@/types'
import type React from 'react'

type SocialLink = {
	platform: string
	url: string
	username?: string
}

type FooterAboutProps = {
	profileData: SiteProfileExtended
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
			className="relative h-140 w-full border-t mt-24 pt-24 pointer-events-auto"
			style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}>
			<div className="fixed bottom-0 h-140 w-4xl pointer-events-auto">
				<div className="sticky top-[calc(100vh-560px)] h-full overflow-y-auto pointer-events-auto">
					<div className="relative flex flex-col justify-between gap-5 px-4">
						{/* <div
							aria-hidden
							className="absolute inset-0 isolate z-0 opacity-50 contain-strict dark:opacity-100">
							<div className="-translate-y-87.5 -rotate-45 absolute top-0 left-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
							<div className="-rotate-45 absolute top-0 left-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
							<div className="-translate-y-87.5 -rotate-45 absolute top-0 left-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
						</div> */}
						<div className="flex flex-col gap-8 pt-12 md:flex-row">
							<AnimatedContainer className="w-full min-w-2xs max-w-sm space-y-4">
								<div className="mt-8 md:mt-0">
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
							<AnimatedContainer className="w-full space-y-4" delay={0.1}>
								<div>
									<h1 className="text-4xl font-bold mb-4">
										{profileData.name}
									</h1>
									<p className="text-xl text-muted-foreground mb-6">
										{profileData.title}
									</p>
									<p className="text-lg mb-6">{profileData.bio}</p>

									{profileData.location && (
										<p className="mb-2">📍 {profileData.location}</p>
									)}

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
											</div>
										)}
								</div>
								<div className="flex items-center justify-between pb-24 gap-2 border-t py-4 text-muted-foreground text-sm md:flex-row">
									<p>&copy; 2025 xdream, All rights reserved.</p>
									<a className="hover:text-foreground" href="#">
										License
									</a>
								</div>
							</AnimatedContainer>
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}
