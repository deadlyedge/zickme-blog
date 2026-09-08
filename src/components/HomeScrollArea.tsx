'use client'

import { useScroll, useSpring, useTransform } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	LatestPostsSection,
	PinnedPostsSection,
	TopHottestSection,
} from '@/components/home'
import type { ContentResponse } from '@/types'
import { FooterAbout } from './Footer'
import { Hero } from './Hero'

type HomeScrollAreaProps = { data: ContentResponse }

// 沉浸式全局环境背景色谱（与 TOP5 热门文章轮播联动）
const PALETTE_COLORS = [
	'rgba(249, 115, 22, 0.08)', // 燃橙
	'rgba(59, 130, 246, 0.08)', // 极光蓝
	'rgba(168, 85, 247, 0.08)', // 赛博紫
	'rgba(16, 185, 129, 0.08)', // 翡翠绿
	'rgba(244, 63, 94, 0.08)', // 霓虹红
]

export const HomeScrollArea = ({ data }: HomeScrollAreaProps) => {
	const scrollRef = useRef<HTMLDivElement>(null)
	const [activeHottestIndex, setActiveHottestIndex] = useState(0)
	const { profile, posts, hottestPosts = [], pinnedPosts = [] } = data

	const landingConfig = profile?.landingPageConfig

	// 模块开关，默认在未设置时均为开启
	const showTopHottest = landingConfig?.showTopHottest ?? true
	const showSlogans = landingConfig?.showSlogans ?? true
	const showPinnedPosts = landingConfig?.showPinnedPosts ?? true
	const showLatestPosts = landingConfig?.showLatestPosts ?? true

	const { scrollYProgress } = useScroll({
		container: scrollRef,
		offset: ['0 0', '1 1'],
	})
	const smoothed = useSpring(scrollYProgress, {
		damping: 30,
		stiffness: 100,
		restDelta: 0.001,
	})

	// 滚动背景渐变映射
	const backgroundColor = useTransform(
		smoothed,
		[0, 1],
		['hsl(108,31%,50%)', 'hsl(0, 0, 95%)'],
	)

	// 监听背景颜色变化并应用到 CSS 变量
	useEffect(() => {
		const updateBackground = () => {
			document.documentElement.style.setProperty(
				'--scroll-bg-color',
				backgroundColor.get(),
			)
		}

		updateBackground()
		const unsubscribe = backgroundColor.on('change', updateBackground)
		return () => unsubscribe()
	}, [backgroundColor])

	useEffect(() => {
		document.body.classList.add('has-scroll-bg')
		return () => {
			document.body.classList.remove('has-scroll-bg')
		}
	}, [])

	const handleHottestChange = useCallback((index: number) => {
		setActiveHottestIndex(index)
	}, [])

	const currentAmbientColor =
		PALETTE_COLORS[activeHottestIndex % PALETTE_COLORS.length]

	return (
		<div
			ref={scrollRef}
			id="page-scroll"
			className="h-svh overflow-y-auto overflow-x-hidden relative transition-colors duration-1000"
			style={{
				backgroundColor: currentAmbientColor,
			}}
		>
			{/* 全屏环境光呼吸晕染层 */}
			<div
				className="fixed inset-0 pointer-events-none transition-all duration-1000 -z-10"
				style={{
					background: `radial-gradient(circle at 50% 20%, ${currentAmbientColor.replace('0.08', '0.15')}, transparent 70%)`,
				}}
			/>

			<div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 relative z-10">
				{/* 1. TOP 5 热门文章轮播/翻页区（置顶在最前，带自适应呼吸光晕与全屏色彩联动） */}
				{showTopHottest && hottestPosts.length > 0 && (
					<TopHottestSection
						posts={hottestPosts}
						onActiveChange={handleHottestChange}
					/>
				)}

				{/* 2. Slogan 视差 Hero 区 */}
				{showSlogans && <Hero profile={profile} />}

				{/* 内容卡片聚合容器 */}
				<div className="pt-10 px-3 sm:px-6 bg-background/85 dark:bg-background/90 rounded-3xl border border-border/50 shadow-sm backdrop-blur-md">
					{/* 3. 置顶文章推荐区 */}
					{showPinnedPosts && pinnedPosts.length > 0 && (
						<PinnedPostsSection posts={pinnedPosts} />
					)}

					{/* 4. 最新发布文章区 */}
					{showLatestPosts && posts && posts.length > 0 && (
						<LatestPostsSection posts={posts} />
					)}
				</div>

				{/* 5. 底部关于与社交区 */}
				<FooterAbout profileData={profile} />
			</div>
		</div>
	)
}
