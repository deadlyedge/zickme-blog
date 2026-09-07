'use client'

import { useScroll, useSpring, useTransform } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { ContentResponse } from '@/types'
import { FooterAbout } from './Footer'
import { Hero } from './Hero'
import { PostCard } from './PostCard'

type HomeScrollAreaProps = { data: ContentResponse }

export const HomeScrollArea = ({ data }: HomeScrollAreaProps) => {
	const scrollRef = useRef(null)
	const { profile, posts } = data
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

	// 将滚动进度映射到背景颜色
	const backgroundColor = useTransform(
		smoothed,
		[0, 1],
		['hsl(108,31%,50%)', 'hsl(0, 0, 95%)'],
	)

	// 监听背景颜色变化并应用到CSS变量
	useEffect(() => {
		const updateBackground = () => {
			document.documentElement.style.setProperty(
				'--scroll-bg-color',
				backgroundColor.get(),
			)
		}

		// 初始设置
		updateBackground()

		// 监听颜色变化
		const unsubscribe = backgroundColor.on('change', updateBackground)

		return () => unsubscribe()
	}, [backgroundColor])

	// 在组件挂载时给body添加类，卸载时移除类
	useEffect(() => {
		document.body.classList.add('has-scroll-bg')

		return () => {
			document.body.classList.remove('has-scroll-bg')
		}
	}, [])

	return (
		<div
			ref={scrollRef}
			id="page-scroll"
			className="h-svh overflow-y-auto overflow-x-hidden"
		>
			<div className="mx-auto max-w-7xl sm:px-6 py-16 sm:py-24">
				<Hero profile={profile} scale={scaleX} />

				{/* LATEST POSTS */}
				<section
					id="posts"
					className="pt-20 px-2 bg-linear-to-b from-[hsla(49,80%,92%,0.8)] rounded-t-3xl"
				>
					<div className="flex items-baseline justify-between">
						<h2 className="text-3xl font-semibold">Latest Posts</h2>
						<Link
							href="/posts"
							className="text-sm text-slate-500 hover:underline"
						>
							See all posts
						</Link>
					</div>

					<div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{posts?.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
				</section>

				<FooterAbout profileData={profile} />
			</div>
		</div>
	)
}
