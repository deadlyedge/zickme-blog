'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { useScroll, useSpring, useTransform } from 'motion/react'
import { ContentResponse } from '@/lib/content-providers'
import { formatPublishedDate } from '@/lib/utils'
import { Hero } from './Hero'

type HomeScrollAreaProps = { data: ContentResponse }

export const HomeScrollArea = ({ data }: HomeScrollAreaProps) => {
	const scrollRef = useRef(null)
	const { profile, projects, blogPosts } = data
	const { scrollYProgress } = useScroll({
		container: scrollRef,
		offset: ['0 0', '1 1'],
	})
	const smoothed = useSpring(scrollYProgress, {
		damping: 30,
		stiffness: 100,
		restDelta: 0.001,
	})

	const scaleX = useTransform(smoothed, [0, 1], [0, 1])

	return (
		<div ref={scrollRef} id="page-scroll" className="h-svh overflow-y-auto">
			<div className="mx-auto max-w-7xl sm:px-6 py-16 sm:py-24">
				{/* <motion.div
					className="fixed top-20 left-0 right-0 h-2 bg-blue-500 z-10"
					style={{ scaleX, transformOrigin: '0%' }}
				/> */}
				{/* <MotionTest scrollYProgress={scrollYProgress} /> */}
				<Hero profile={profile} scale={scaleX} />

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
						<Link
							href="/blog"
							className="text-sm text-slate-500 hover:underline">
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
											<h3 className="mt-1 text-lg font-semibold">
												{post.title}
											</h3>
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
		</div>
	)
}
