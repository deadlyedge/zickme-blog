import { GlobeIcon, MailIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { CardTilt, CardTiltContent } from '@/components/ui/effects/CardTilt'

import { fetchProfile } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'

type SocialLink = {
	platform: string
	url: string
	username?: string
}

type Technology = {
	name: string
	level?: string
}

type Skill = {
	category: string
	technologies: Technology[]
}

export const revalidate = 3600 // 每小时重新验证一次

export const metadata: Metadata = buildMetadata({
	title: 'About',
	description: 'Learn more about me and my background.',
})

export default async function AboutPage() {
	const profileData = await fetchProfile()

	if (!profileData) {
		return <div>暂无个人资料</div>
	}

	return (
		<div className="pt-16 overflow-y-auto h-svh">
			<section className="mx-auto p-6 max-w-4xl">
				<div className="grid md:grid-cols-2 gap-12">
					<div>
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

					<div>
						<h1 className="text-4xl font-bold mb-4">{profileData.name}</h1>
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
									className="text-primary hover:underline"
								>
									{profileData.website}
								</a>
							</p>
						)}

						{profileData.socialLinks &&
							Array.isArray(profileData.socialLinks) && (
								<div className="flex gap-4">
									{(profileData.socialLinks as SocialLink[]).map((link) => (
										<a
											key={link.platform}
											href={link.url}
											className="text-2xl hover:opacity-75"
											target="_blank"
											rel="noopener noreferrer"
										>
											{link.platform}
										</a>
									))}
								</div>
							)}
					</div>
				</div>

				{profileData.skills && Array.isArray(profileData.skills) && (
					<section className="mt-16">
						<h2 className="text-3xl font-bold mb-8">技能专长</h2>
						<div className="grid md:grid-cols-2 gap-8">
							{(profileData.skills as Skill[]).map((skill, index: number) => (
								<CardTilt
									key={`${index}-${skill.category}`}
									tiltMaxAngle={15}
									scale={1.05}
								>
									<CardTiltContent className="rounded-2xl bg-card shadow-2xl p-6">
										<h3 className="text-lg font-semibold mb-4">
											{skill.category}
										</h3>
										<div className="space-y-2">
											{skill.technologies?.map((tech, techIndex: number) => (
												<div
													key={`${techIndex}-${tech.name}`}
													className="flex justify-between"
												>
													<span>{tech.name}</span>
													<span className="text-muted-foreground">
														{tech.level}
													</span>
												</div>
											))}
										</div>
									</CardTiltContent>
								</CardTilt>
							))}
						</div>
					</section>
				)}
			</section>
		</div>
	)
}
