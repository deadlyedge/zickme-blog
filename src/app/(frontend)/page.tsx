import { fetchContent } from '@/lib/content/content-api'
import { format, parseISO, isValid } from 'date-fns'

const formatMonthYear = (value: string) => {
	const date = parseISO(value)
	if (!isValid(date)) {
		return value
	}

	return format(date, 'MMM yyyy')
}

const formatDuration = (start: string, end: string | null) => {
	const startLabel = formatMonthYear(start)
	const endLabel = end ? formatMonthYear(end) : 'Present'
	return `${startLabel} — ${endLabel}`
}

const formatPublishedDate = (value: string) => {
	const date = parseISO(value)
	if (!isValid(date)) {
		return value
	}

	return format(date, 'MMMM d, yyyy')
}

export default async function HomePage() {
	const data = await fetchContent()

	const { profile, projects, blogPosts } = data

	return (
		<div className="min-h-screen bg-slate-950/5 text-slate-900">
			<div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16">
				<section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur">
					<p className="text-xs uppercase tracking-[0.4em] text-slate-500">
						Profile ⋅ Journal
					</p>
					<h1 className="mt-4 text-5xl font-semibold text-slate-900">
						{profile?.name ?? 'Zickme'}
					</h1>
					<p className="text-2xl font-medium text-slate-600">
						{profile?.title ?? 'Full-stack builder'}
					</p>
					{profile?.bio && (
						<p className="mt-4 text-base text-slate-600">{profile.bio}</p>
					)}
					<div className="mt-6 flex flex-wrap gap-2">
						{profile?.skills?.flatMap(skillCategory =>
							skillCategory.technologies.map(tech => (
								<span
									key={`${skillCategory.category}-${tech.name}`}
									className="rounded-full border border-slate-300/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
									{tech.name}
								</span>
							))
						)}
					</div>
					<div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
						{profile?.email && (
							<a
								className="hover:text-slate-900"
								href={`mailto:${profile.email}`}>
								{profile.email}
							</a>
						)}
						{profile?.location && <span>{profile.location}</span>}
						{profile?.website && (
							<a
								className="hover:text-slate-900"
								href={profile.website}
								target="_blank"
								rel="noreferrer">
								Website
							</a>
						)}
					</div>
					{profile?.socialLinks && profile.socialLinks.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-3">
							{profile.socialLinks.map((link) => (
								<a
									key={link.url}
									className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
									href={link.url}
									rel="noreferrer"
									target="_blank">
									{link.platform}
								</a>
							))}
						</div>
					)}
				</section>

				<section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-lg shadow-slate-900/5">
					<div className="mb-8 flex items-baseline justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.4em] text-slate-500">
								Portfolio
							</p>
							<h2 className="text-3xl font-semibold text-slate-900">
								Projects & Work
							</h2>
						</div>
						<span className="text-sm text-slate-500">
							{projects.length} projects
						</span>
					</div>

					{projects.length === 0 ? (
						<p className="text-sm text-slate-500">No projects yet.</p>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{projects.map((project) => (
								<article
									key={project.title}
									className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
									{project.images.length > 0 && (
										<div
											className="h-48 w-full bg-slate-900/5"
											style={
												project.images[0].url
													? {
															backgroundImage: `url(${project.images[0].url})`,
															backgroundSize: 'cover',
															backgroundPosition: 'center',
														}
													: undefined
											}
										/>
									)}
									<div className="p-6">
										<div className="flex items-start justify-between gap-3 mb-3">
											<h3 className="text-lg font-semibold text-slate-900">
												{project.title}
											</h3>
											{project.featured && (
												<span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-medium text-white">
													Featured
												</span>
											)}
										</div>
										<p className="text-sm text-slate-600 mb-4">
											{project.description}
										</p>
										<div className="flex flex-wrap gap-2 mb-4">
											{project.technologies.map((tech) => (
												<span
													key={tech.name}
													className="rounded-full border border-slate-300/80 px-2 py-1 text-xs font-medium text-slate-600">
													{tech.name}
												</span>
											))}
										</div>
										<div className="flex gap-3 text-xs text-slate-500">
											{project.demoUrl && (
												<a
													className="hover:text-slate-900 underline"
													href={project.demoUrl}
													target="_blank"
													rel="noreferrer">
													Demo
												</a>
											)}
											{project.sourceUrl && (
												<a
													className="hover:text-slate-900 underline"
													href={project.sourceUrl}
													target="_blank"
													rel="noreferrer">
													Source
												</a>
											)}
											{project.startDate && (
												<span>
													{project.endDate
														? formatDuration(project.startDate, project.endDate)
														: `Started ${formatMonthYear(project.startDate)}`}
												</span>
											)}
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</section>

				<section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-lg shadow-slate-900/5">
					<div className="mb-8 flex items-baseline justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.4em] text-slate-500">
								Blog
							</p>
							<h2 className="text-3xl font-semibold text-slate-900">
								Notes & Ideas
							</h2>
						</div>
						<span className="text-sm text-slate-500">
							{blogPosts.length} stories
						</span>
					</div>

					{blogPosts.length === 0 ? (
						<p className="text-sm text-slate-500">No published posts yet.</p>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{blogPosts.map((post) => (
								<article
									key={post.slug}
									className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
									<div
										className="h-36 w-full bg-slate-900/5"
										style={
											post.featuredImageUrl
												? {
														backgroundImage: `url(${post.featuredImageUrl})`,
														backgroundSize: 'cover',
														backgroundPosition: 'center',
													}
												: undefined
										}
									/>
									<div className="flex flex-col gap-3 p-6">
										<div className="flex items-center justify-between text-xs text-slate-500">
											<span>
												{post.publishedAt ? formatPublishedDate(post.publishedAt) : 'Draft'}
											</span>
											<span>Quick read</span>
										</div>
										<h3 className="text-lg font-semibold text-slate-900">
											{post.title}
										</h3>
										{post.excerpt && (
											<p className="text-sm text-slate-600">{post.excerpt}</p>
										)}
										<div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest text-slate-500">
											{post.tags.map((tag) => (
												<span
													key={tag.slug}
													className="rounded-full border border-slate-200 px-3 py-1"
													style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}>
													{tag.name}
												</span>
											))}
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
