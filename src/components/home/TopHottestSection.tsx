'use client'

import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	Flame,
	Sparkles,
	TrendingUp,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPublishedDate } from '@/lib/utils'
import type { PostWithTags } from '@/types'

interface TopHottestSectionProps {
	posts: PostWithTags[]
	onActiveChange?: (index: number) => void
}

// 对应每个文章卡片切换时的沉浸式呼吸脉冲光晕色谱
const GLOW_PALETTES = [
	{
		primary: 'rgba(249, 115, 22, 0.28)', // 燃橙
		secondary: 'rgba(234, 88, 12, 0.18)',
		accent: '#f97316',
	},
	{
		primary: 'rgba(59, 130, 246, 0.28)', // 极光蓝
		secondary: 'rgba(99, 102, 241, 0.18)',
		accent: '#3b82f6',
	},
	{
		primary: 'rgba(168, 85, 247, 0.28)', // 赛博紫
		secondary: 'rgba(236, 72, 153, 0.18)',
		accent: '#a855f7',
	},
	{
		primary: 'rgba(16, 185, 129, 0.28)', // 翡翠绿
		secondary: 'rgba(20, 184, 166, 0.18)',
		accent: '#10b981',
	},
	{
		primary: 'rgba(244, 63, 94, 0.28)', // 霓虹红
		secondary: 'rgba(251, 146, 60, 0.18)',
		accent: '#f43f5e',
	},
]

export const TopHottestSection: React.FC<TopHottestSectionProps> = ({
	posts,
	onActiveChange,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [direction, setDirection] = useState<1 | -1>(1)
	const [isPaused, setIsPaused] = useState(false)

	const total = posts.length

	const handleNext = useCallback(() => {
		if (total <= 1) return
		setDirection(1)
		setCurrentIndex((prev) => (prev + 1) % total)
	}, [total])

	const handlePrev = useCallback(() => {
		if (total <= 1) return
		setDirection(-1)
		setCurrentIndex((prev) => (prev - 1 + total) % total)
	}, [total])

	// 当 currentIndex 发生变化时通知外部父组件（通过 useEffect 避免在 render 过程中 setState）
	useEffect(() => {
		onActiveChange?.(currentIndex)
	}, [currentIndex, onActiveChange])

	// 自动轮播（悬停时暂停）
	useEffect(() => {
		if (total <= 1 || isPaused) return
		const timer = setInterval(() => {
			handleNext()
		}, 6000)
		return () => clearInterval(timer)
	}, [total, isPaused, handleNext])

	if (!posts || posts.length === 0) return null

	const currentPost = posts[currentIndex]
	const currentGlow = GLOW_PALETTES[currentIndex % GLOW_PALETTES.length]

	const slideVariants = {
		enter: (dir: number) => ({
			x: dir > 0 ? 120 : -120,
			opacity: 0,
			scale: 0.96,
			rotateY: dir > 0 ? 10 : -10,
		}),
		center: {
			x: 0,
			opacity: 1,
			scale: 1,
			rotateY: 0,
			transition: {
				duration: 0.55,
				ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
			},
		},
		exit: (dir: number) => ({
			x: dir > 0 ? -120 : 120,
			opacity: 0,
			scale: 0.96,
			rotateY: dir > 0 ? -10 : 10,
			transition: {
				duration: 0.45,
				ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
			},
		}),
	}

	return (
		<section
			aria-labelledby="top-hottest-title"
			className="relative mb-20 pt-8 pb-12 overflow-visible"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			{/* 随当前热门文章切换的多重呼吸脉冲光晕与色彩变换 */}
			<div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center overflow-visible">
				<motion.div
					key={`pulse-glow-primary-${currentIndex}`}
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{
						opacity: [0.4, 0.8, 0.5],
						scale: [0.95, 1.1, 1],
					}}
					transition={{
						duration: 4,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: 'reverse',
						ease: 'easeInOut',
					}}
					className="absolute w-[90%] sm:w-[85%] h-[320px] sm:h-[420px] rounded-full blur-[90px] transition-colors duration-1000"
					style={{
						backgroundColor: currentGlow.primary,
					}}
				/>
				<motion.div
					key={`pulse-glow-secondary-${currentIndex}`}
					initial={{ opacity: 0 }}
					animate={{
						opacity: [0.2, 0.5, 0.3],
						scale: [1.05, 0.9, 1.05],
					}}
					transition={{
						duration: 5,
						repeat: Number.POSITIVE_INFINITY,
						repeatType: 'reverse',
						ease: 'easeInOut',
					}}
					className="absolute w-[75%] sm:w-[70%] h-[240px] sm:h-[300px] rounded-full blur-[70px] transition-colors duration-1000"
					style={{
						backgroundColor: currentGlow.secondary,
					}}
				/>
			</div>

			{/* 顶部标题区与左右切换按钮 */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
				<div className="space-y-1.5">
					<div
						className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-border/60 bg-background/80 dark:bg-card/80 backdrop-blur-md shadow-xs transition-colors duration-500"
						style={{
							color: currentGlow.accent,
						}}
					>
						<Flame className="size-3.5 fill-current" />
						TOP 5 HOTTEST
					</div>
					<h2
						id="top-hottest-title"
						className="text-2xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3"
					>
						<span>热门文章精选</span>
						<span className="text-sm font-normal text-muted-foreground hidden sm:inline">
							热议深度与精选内容
						</span>
					</h2>
				</div>

				{total > 1 && (
					<div className="flex items-center gap-3 self-end sm:self-auto">
						<div className="flex items-center gap-2 mr-2">
							{posts.map((post, idx) => (
								<button
									key={`indicator-${post.id}`}
									type="button"
									onClick={() => {
										setDirection(idx > currentIndex ? 1 : -1)
										setCurrentIndex(idx)
									}}
									className={`h-2 rounded-full transition-all duration-500 ${
										idx === currentIndex
											? 'w-8'
											: 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
									}`}
									style={{
										backgroundColor:
											idx === currentIndex ? currentGlow.accent : undefined,
									}}
									aria-label={`切换到第 ${idx + 1} 篇热门文章`}
								/>
							))}
						</div>

						<div className="flex items-center gap-1.5">
							<Button
								variant="outline"
								size="icon"
								onClick={handlePrev}
								className="rounded-full size-9 bg-background/80 dark:bg-card/80 backdrop-blur-md hover:scale-105 transition-all shadow-xs"
								aria-label="上一篇热门文章"
							>
								<ArrowLeft className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={handleNext}
								className="rounded-full size-9 bg-background/80 dark:bg-card/80 backdrop-blur-md hover:scale-105 transition-all shadow-xs"
								aria-label="下一篇热门文章"
							>
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* 3D 翻页/滑动主卡片容器 */}
			<div className="relative min-h-[460px] sm:min-h-[420px] w-full perspective-[1200px]">
				<AnimatePresence initial={false} custom={direction} mode="wait">
					{currentPost && (
						<motion.div
							key={currentPost.id}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							className="group relative w-full rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl transition-all duration-300"
							style={{
								boxShadow: `0 20px 50px -12px ${currentGlow.primary}, 0 0 0 1px rgba(255, 255, 255, 0.08)`,
							}}
						>
							{/* 左侧/上方 封面大图区 */}
							<div className="relative lg:col-span-7 h-64 sm:h-80 lg:h-full min-h-[260px] lg:min-h-[420px] overflow-hidden bg-muted">
								{currentPost.poster ? (
									<Image
										src={currentPost.poster}
										alt={currentPost.title}
										fill
										sizes="(max-width: 1024px) 100vw, 60vw"
										className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
										priority
									/>
								) : (
									<div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-500">
										<Sparkles className="size-20 text-slate-600/60 mb-3" />
										<span className="text-sm font-mono tracking-widest text-slate-400 font-semibold">
											HOTTEST POST
										</span>
									</div>
								)}

								{/* 动态环境光渐变 */}
								<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent lg:bg-linear-to-r lg:from-transparent lg:via-black/25 lg:to-black/85 pointer-events-none" />

								{/* TOP 标签与排名 */}
								<div className="absolute top-5 left-5 flex items-center gap-2 z-10">
									<div
										className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-xs font-black tracking-wider shadow-xl transition-colors duration-500"
										style={{ backgroundColor: currentGlow.accent }}
									>
										<TrendingUp className="size-3.5" />#
										{String(currentIndex + 1).padStart(2, '0')} HOT
									</div>
								</div>
							</div>

							{/* 右侧信息与详情内容 */}
							<div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-card/90">
								<div className="space-y-5">
									<div className="flex flex-wrap items-center gap-2">
										{currentPost.tags?.slice(0, 4).map((t) => (
											<Badge
												key={t.slug}
												style={{
													backgroundColor: t.color || undefined,
													color: t.color ? '#fff' : undefined,
												}}
												className="shadow-xs px-2.5 py-0.5 text-xs font-medium"
											>
												{t.name}
											</Badge>
										))}
									</div>

									<Link
										href={`/posts/${currentPost.slug}`}
										className="block group-hover:text-primary transition-colors"
									>
										<h3 className="text-2xl sm:text-3xl lg:text-3xl font-black tracking-tight leading-snug line-clamp-2 sm:line-clamp-3">
											{currentPost.title}
										</h3>
									</Link>

									<p className="text-sm sm:text-base text-muted-foreground line-clamp-4 leading-relaxed font-normal">
										{currentPost.excerpt || '暂无摘要描述...'}
									</p>
								</div>

								{/* 卡片底栏信息 */}
								<div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
									<div className="text-xs text-muted-foreground">
										{currentPost.publishedAt && (
											<span>
												发布于{' '}
												{formatPublishedDate(
													currentPost.publishedAt.toISOString(),
												)}
											</span>
										)}
									</div>

									<Button
										asChild
										size="lg"
										className="rounded-full shadow-lg group/btn gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all font-semibold"
									>
										<Link href={`/posts/${currentPost.slug}`}>
											<span>阅读全文</span>
											<BookOpen className="size-4 transition-transform group-hover/btn:scale-110" />
										</Link>
									</Button>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	)
}
