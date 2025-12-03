'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useScroll, useSpring, useTransform } from 'motion/react'
import { ContentResponse } from '@/lib/content-providers'
import { Hero } from './Hero'
import { ProjectCard } from './ProjectCard'
import { BlogPostCard } from './BlogPostCard'

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
							<ProjectCard key={project.id} project={project} />
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

					<div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{blogPosts.map((post) => (
							<BlogPostCard key={post.id} post={post} />
						))}
					</div>
				</section>
			</div>
		</div>
	)
}
