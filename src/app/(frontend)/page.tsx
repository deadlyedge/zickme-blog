import Link from 'next/link'
import Image from 'next/image'
import { fetchContent } from '@/lib/content-providers'
import AnimateOnMount from '@/components/AnimateOnMount'
import { formatPublishedDate } from '@/lib/utils'

// const formatMonthYear = (value: string) => {
// 	const date = parseISO(value)
// 	if (!isValid(date)) return value
// 	return format(date, 'MMM yyyy')
// }

/**
 * 进一步视觉微调：
 * - 主色改为 amber（高亮 CTA / 标签）
 * - 更大的卡片阴影、平滑过渡和更明显的 hover 上浮
 * - 图片遮罩与渐变更柔和
 * - 更一致的间距与更紧凑的排版
 */

// 每5分钟重新验证一次，确保内容及时更新
export const revalidate = 300

export default async function HomePage() {
	const data = await fetchContent()
	const { profile, projects, blogPosts } = data

	return (
		<div className="mx-auto max-w-7xl px-6 py-24">
			{/* HERO (juice-style visual) */}
			<section className="relative overflow-hidden">
				{/* Top small CTA pill */}
				<div className="absolute inset-x-0 top-6 flex justify-center z-30">
					<a
						href="#"
						className="inline-flex items-center gap-2 bg-white/90 text-slate-900 px-4 py-2 rounded-full text-xs font-medium shadow-sm">
						WE REBRANDED WITH PURPOSE. READ THE STORY →
					</a>
				</div>

				<div className="bg-[#67a657]">
					<div className="mx-auto max-w-7xl px-6 py-28 relative">
						{/* Decorative giant word behind */}
						<div className="pointer-events-none absolute inset-0 flex items-start">
							<AnimateOnMount delay={0} className="hidden lg:block">
								<span className="text-[22rem] leading-none font-extrabold text-cream opacity-20 -mt-10">
									JUICE
								</span>
							</AnimateOnMount>
						</div>

						<div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
							<div className="lg:col-span-6">
								<h2 className="text-[3.2rem] lg:text-[4rem] leading-tight font-extrabold text-slate-900 max-w-xl">
									THE CREATIVE AGENCY THAT LOVES TO SHOW OFF A THING OR TWO.
								</h2>

								<p className="mt-6 text-slate-900/90 max-w-lg">
									{profile?.bio ??
										'We craft impactful digital experiences for ambitious brands.'}
								</p>

								<div className="mt-8 flex items-center gap-4">
									<Link
										href="/projects"
										className="inline-flex items-center gap-3 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 transition">
										View projects
									</Link>
									<span className="ml-4 text-xs text-slate-900/70 tracking-widest">
										WORK • WEB • BRANDING
									</span>

									<a
										href={profile?.website ?? '#'}
										className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 px-4 py-3 text-sm font-medium text-slate-900/90 hover:bg-white/10 transition"
										target="_blank"
										rel="noreferrer">
										Visit website
									</a>
								</div>
							</div>

							<div className="lg:col-span-6 flex justify-center lg:justify-end">
								{/* Illustration / hero artwork placeholder */}
								<div className="w-80 h-80 rounded-full bg-orange-400 shadow-2xl border-8 border-white/80 flex items-center justify-center">
									<div className="text-6xl font-bold text-white">🏀</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* PROJECTS GRID */}
			<section className="mt-20">
				<div className="flex items-baseline justify-between">
					<h2 className="text-3xl font-semibold">Projects</h2>
					<Link
						href="/projects"
						className="text-sm text-slate-500 hover:underline">
						See full list
					</Link>
				</div>

				<div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<Link key={project.title} href={`/projects/${project.slug}`}>
							<article className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-2xl transition-transform transform hover:-translate-y-3 duration-300">
								<div className="relative aspect-16/10 bg-slate-100">
									{project.images[0]?.url ? (
										<>
											<Image
												src={project.images[0].url}
												alt={project.title}
												fill
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>
											<div className="absolute inset-0 bg-linear-to-t from-black/28 via-transparent to-transparent pointer-events-none" />
										</>
									) : null}
									{project.featured && (
										<div className="absolute left-4 bottom-4 rounded-full bg-amber-600 px-3 py-1 text-xs text-white">
											Featured
										</div>
									)}
								</div>

								<div className="p-6">
									<h3 className="text-lg font-semibold">{project.title}</h3>
									<p className="mt-2 text-sm text-slate-600 line-clamp-3">
										{project.description}
									</p>

									<div className="mt-4 flex flex-wrap gap-2">
										{project.technologies?.map((t) => (
											<span
												key={t.name}
												className="text-xs rounded-full bg-amber-50 px-2 py-1 text-amber-700 border border-amber-100">
												{t.name}
											</span>
										))}
									</div>
								</div>
							</article>{' '}
						</Link>
					))}
				</div>
			</section>

			{/* LATEST POSTS */}
			<section className="mt-20">
				<div className="flex items-baseline justify-between">
					<h2 className="text-3xl font-semibold">Latest posts</h2>
					<Link href="/blog" className="text-sm text-slate-500 hover:underline">
						See all posts
					</Link>
				</div>

				<div className="mt-6 grid gap-6 md:grid-cols-2">
					{blogPosts.map((post) => (
						<Link href={`/blog/${post.slug}`} key={post.slug}>
							<article className="rounded-2xl overflow-hidden border bg-white shadow-sm transition hover:shadow-md">
								<div className="flex gap-6 p-6">
									{post.featuredImageUrl && (
										<div className="w-36 h-24 bg-slate-100 rounded overflow-hidden">
											<Image
												src={post.featuredImageUrl}
												alt={post.title}
												width={144}
												height={96}
												className="object-cover"
											/>
										</div>
									)}
									<div>
										<p className="text-xs text-slate-500">
											{post.publishedAt
												? formatPublishedDate(post.publishedAt)
												: 'Draft'}
										</p>
										<h3 className="mt-1 text-lg font-semibold">{post.title}</h3>
										{post.excerpt && (
											<p className="mt-2 text-sm text-slate-600 line-clamp-3">
												{post.excerpt}
											</p>
										)}
									</div>
								</div>
							</article>{' '}
						</Link>
					))}
				</div>
			</section>
		</div>
	)
}
