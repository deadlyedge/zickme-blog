import Image from 'next/image'
// import Link from 'next/link'
import { fetchProfile } from '@/lib/content-providers'
import { safeExtract } from '@/lib/utils'
import { GlobeIcon, MailIcon } from 'lucide-react'

// 每5分钟重新验证一次
export const revalidate = 300

export default async function AboutPage() {
	const profileData = await fetchProfile()

	if (!profileData) {
		return <div>暂无个人资料</div>
	}

	return (
		<div className="mx-auto p-6 pt-24 max-w-4xl">
			<div className="grid md:grid-cols-2 gap-12">
				<div>
					{profileData.avatar && (
						<Image
							src={safeExtract(profileData.avatar)?.url || ''}
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
								className="text-primary hover:underline">
								{profileData.website}
							</a>
						</p>
					)}

					{profileData.socialLinks && (
						<div className="flex gap-4">
							{profileData.socialLinks.map((link, index: number) => (
								<a
									key={index}
									href={link.url}
									className="text-2xl hover:opacity-75"
									target="_blank"
									rel="noopener noreferrer">
									{link.platform}
								</a>
							))}
						</div>
					)}
				</div>
			</div>

			{profileData.skills && (
				<section className="mt-16">
					<h2 className="text-3xl font-bold mb-8">技能专长</h2>
					<div className="grid md:grid-cols-2 gap-8">
						{profileData.skills.map((skill, index: number) => (
							<div key={index}>
								<h3 className="text-lg font-semibold mb-4">{skill.category}</h3>
								<div className="space-y-2">
									{skill.technologies?.map((tech, techIndex: number) => (
										<div key={techIndex} className="flex justify-between">
											<span>{tech.name}</span>
											<span className="text-muted-foreground">
												{tech.level}
											</span>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	)
}
