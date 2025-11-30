import Link from 'next/link'
import Image from 'next/image'
import { fetchContent } from '@/lib/content-api'
import { RichText } from '@/components/RichText'
import { format, parseISO, isValid } from 'date-fns'

const formatMonthYear = (value?: string | null) => {
	if (!value) return ''
	const date = parseISO(value)
	if (!isValid(date)) return value
	return format(date, 'MMM yyyy')
}

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')

type Props = {
	params: Promise<{
		slug: string
	}>
}

export default async function ProjectPage({ params }: Props) {
	const { slug } = await params
	const { projects } = await fetchContent()

	const project = projects.find((p) => slugify(p.title) === slug)

	if (!project) {
		return (
			<main className="min-h-screen flex items-center justify-center p-12">
				<div className="max-w-3xl text-center">
					<h1 className="text-3xl font-semibold">Project not found</h1>
					<p className="mt-4 text-slate-600">
						We could not find the project you were looking for.
					</p>
					<div className="mt-6">
						<Link
							href="/projects"
							className="text-sm text-amber-600 hover:underline">
							Back to projects
						</Link>
					</div>
				</div>
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-white text-slate-900">
			<div className="mx-auto max-w-7xl px-6 py-20">
				<nav className="mb-6">
					<Link
						href="/projects"
						className="text-sm text-slate-500 hover:underline">
						← Back to projects
					</Link>
				</nav>

				<header className="mb-10">
					<h1 className="text-4xl md:text-5xl font-extrabold">
						{project.title}
					</h1>
					<div className="mt-4 flex flex-wrap items-center gap-3">
						{project.technologies.map((t) => (
							<span
								key={t.name}
								className="text-xs rounded-full bg-amber-50 px-2 py-1 text-amber-700 border border-amber-100">
								{t.name}
							</span>
						))}
						{project.startDate && (
							<span className="text-sm text-slate-500 ml-2">
								{formatMonthYear(project.startDate)}
							</span>
						)}
					</div>
				</header>

				{/* Hero / Lead image */}
				{project.images?.[0]?.url && (
					<div className="rounded-3xl overflow-hidden shadow-lg mb-10">
						<div className="relative w-full aspect-video bg-slate-100">
							<Image
								src={project.images[0].url}
								alt={project.title}
								fill
								sizes="(min-width: 1024px) 1200px, 100vw"
								className="object-cover"
							/>
						</div>
						{project.images[0].caption && (
							<div className="p-4 text-xs text-slate-500">
								{project.images[0].caption}
							</div>
						)}
					</div>
				)}

				<section className="prose max-w-none mb-12">
					<p className="text-lg text-slate-700">{project.description}</p>
					{/* Render longDescription (Payload richText) as simple HTML */}
					{project.longDescription && (
						<div className="mt-6">
							<RichText value={project.longDescription} />
						</div>
					)}
				</section>

				{/* Gallery */}
				{project.images && project.images.length > 1 && (
					<section className="mb-12 grid gap-4 sm:grid-cols-2">
						{project.images.slice(1).map((img, idx) => (
							<div
								key={idx}
								className="rounded-xl overflow-hidden bg-slate-100">
								{img.url ? (
									<Image
										src={img.url}
										alt={img.caption ?? `${project.title} image ${idx + 2}`}
										width={1200}
										height={800}
										className="w-full h-auto object-cover"
									/>
								) : (
									<div className="h-48 flex items-center justify-center text-slate-400">
										No image
									</div>
								)}
								{img.caption && (
									<div className="p-3 text-sm text-slate-500">
										{img.caption}
									</div>
								)}
							</div>
						))}
					</section>
				)}

				{/* Links */}
				<section className="flex flex-wrap items-center gap-4">
					{project.demoUrl && (
						<a
							href={project.demoUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-700 transition">
							View demo
						</a>
					)}
					{project.sourceUrl && (
						<a
							href={project.sourceUrl}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
							Source
						</a>
					)}
				</section>
			</div>
		</main>
	)
}
