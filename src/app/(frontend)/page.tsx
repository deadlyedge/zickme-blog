import Link from 'next/link'
import Image from 'next/image'
import { fetchContent } from '@/lib/content-providers'
import { formatPublishedDate } from '@/lib/utils'
import { Hero } from '@/components/Hero'

// 每5分钟重新验证一次，确保内容及时更新
export const revalidate = 300

export default async function HomePage() {
	const data = await fetchContent()
	const { profile, projects, blogPosts } = data

	return (
		<div className="mx-auto max-w-7xl sm:px-6 py-16 sm:py-24">
			<Hero profile={profile} />
			{/* <MotionTest /> */}

			{/* PROJECTS GRID */}
			<section className="pt-16 px-2 bg-linear-to-b from-[hsl(108,31%,80%)]">
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
