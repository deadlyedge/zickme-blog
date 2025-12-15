'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useScroll, useSpring, useTransform } from 'motion/react'
import { ContentResponse } from '@/lib/content-providers'
import { Hero } from './Hero'
import { PostCard } from './PostCard'
import { FooterAbout } from './Footer'

type HomeScrollAreaProps = { data: ContentResponse }

export const HomeScrollArea = ({ data }: HomeScrollAreaProps) => {
	const scrollRef = useRef(null)
	const { profile, projects, blog } = data
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

				{/* LATEST PROJECTS */}
				<section
					id="projects"
					className="pt-20 px-2 bg-linear-to-b from-[hsl(108,31%,80%)]">
					<div className="flex items-baseline justify-between">
						<h2 className="text-3xl font-semibold">Latest projects</h2>
						<Link
							href="/projects"
							className="text-sm text-slate-500 hover:underline">
							See all projects
						</Link>
					</div>

					<div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{projects.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
				</section>

				{/* LATEST BLOG */}
				<section id="blog" className="mt-20 px-2">
					<div className="flex items-baseline justify-between">
						<h2 className="text-3xl font-semibold">Latest blog</h2>
						<Link
							href="/blog"
							className="text-sm text-slate-500 hover:underline">
							See all blog
						</Link>
					</div>

					<div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{blog.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
				</section>

				<FooterAbout profileData={profile} />
			</div>
		</div>
	)
}
