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
		setCurrentIndex((prev) => {
			const next = (prev + 1) % total
			onActiveChange?.(next)
			return next
		})
	}, [total, onActiveChange])

	const handlePrev = useCallback(() => {
		if (total <= 1) return
		setDirection(-1)
		setCurrentIndex((prev) => {
			const prevIdx = (prev - 1 + total) % total
			onActiveChange?.(prevIdx)
			return prevIdx
		})
	}, [total, onActiveChange])

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
			<div className="absolute inset-x-0 -top-12 -bottom-12 pointer-events-none -z-10 overflow-hidden rounded-[3rem]">
				{/* 动态主呼吸脉冲光环 */}
				<motion.div
					key={`glow-primary-${currentIndex}`}
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{
						opacity: [0.6, 0.95, 0.6],
						scale: [0.95, 1.08, 0.95],
					}}
					transition={{
						opacity: {
							duration: 4,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						},
						scale: {
							duration: 5,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
						},
					}}
					className="absolute -top-20 left-1/4 h-96 w-[600px] -translate-x-1/2 rounded-full blur-3xl"
					style={{
						background: `radial-gradient(circle, ${currentGlow.primary} 0%, transparent 70%)`,
					}}
				/>

				{/* 辅助副色调脉冲光晕 */}
				<motion.div
					key={`glow-secondary-${currentIndex}`}
					initial={{ opacity: 0, scale: 0.85 }}
					animate={{
						opacity: [0.4, 0.8, 0.4],
						scale: [1, 1.15, 1],
					}}
					transition={{
						opacity: {
							duration: 4.5,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
							delay: 1,
						},
						scale: {
							duration: 6,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'easeInOut',
							delay: 0.5,
						},
					}}
					className="absolute -bottom-16 right-1/4 h-96 w-[550px] translate-x-1/3 rounded-full blur-3xl"
					style={{
						background: `radial-gradient(circle, ${currentGlow.secondary} 0%, transparent 70%)`,
					}}
				/>
			</div>

			{/* 顶栏控制条 */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
				<div>
					<div
						className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-500"
						style={{
							backgroundColor: `${currentGlow.accent}15`,
							borderColor: `${currentGlow.accent}35`,
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
										onActiveChange?.(idx)
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
								size="icon-sm"
								onClick={handlePrev}
								aria-label="上一篇热门文章"
								className="rounded-full shadow-xs hover:bg-muted"
							>
								<ArrowLeft className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								onClick={handleNext}
								aria-label="下一篇热门文章"
								className="rounded-full shadow-xs hover:bg-muted"
							>
								<ArrowRight className="size-4" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* 增加高度后的主卡片展示区 */}
			<div className="relative min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] w-full [perspective:1400px]">
				<AnimatePresence mode="wait" custom={direction}>
					{currentPost && (
						<motion.div
							key={currentPost.id}
							custom={direction}
							variants={slideVariants}
							initial="enter"
							animate="center"
							exit="exit"
							className="relative w-full rounded-3xl border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 group"
						>
							{/* 左侧封面大图区域（高度提升，视觉更宽广震撼） */}
							<div className="relative lg:col-span-7 h-72 sm:h-96 lg:h-full min-h-[300px] sm:min-h-[420px] lg:min-h-[520px] bg-slate-950 overflow-hidden">
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

							{/* 右侧信息与详情内容（上下充裕留白与更清晰的排版） */}
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
