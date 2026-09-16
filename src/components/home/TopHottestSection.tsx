'use client'

import { ArrowLeft, ArrowRight, Flame, MessageCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavigationLink } from '@/components/NavigationLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPublishedDate } from '@/lib/utils'
import type { HomeGalleryImage } from '@/types/content/home'
import type { PostWithTags } from '@/types/content/post'

type HomeHighlight =
	| { type: 'post'; post: PostWithTags }
	| { type: 'gallery-image'; image: HomeGalleryImage }

interface TopHottestSectionProps {
	posts: PostWithTags[]
	galleryImages: HomeGalleryImage[]
	onActiveChange?: (index: number) => void
}

const ACCENTS = ['#f97316', '#3b82f6', '#a855f7', '#10b981', '#f43f5e']

export const TopHottestSection: React.FC<TopHottestSectionProps> = ({
	posts,
	galleryImages,
	onActiveChange,
}) => {
	const highlights = useMemo<HomeHighlight[]>(
		() => [
			...posts.map((post) => ({ type: 'post' as const, post })),
			...galleryImages.map((image) => ({
				type: 'gallery-image' as const,
				image,
			})),
		],
		[posts, galleryImages],
	)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [direction, setDirection] = useState<1 | -1>(1)
	const [isPaused, setIsPaused] = useState(false)
	const total = highlights.length

	useEffect(() => {
		if (currentIndex >= total && total > 0) setCurrentIndex(0)
	}, [currentIndex, total])

	const move = useCallback(
		(step: 1 | -1) => {
			if (total <= 1) return
			setDirection(step)
			setCurrentIndex((index) => (index + step + total) % total)
		},
		[total],
	)

	useEffect(() => {
		onActiveChange?.(currentIndex)
	}, [currentIndex, onActiveChange])

	useEffect(() => {
		if (total <= 1 || isPaused) return
		const timer = setInterval(() => move(1), 6000)
		return () => clearInterval(timer)
	}, [isPaused, move, total])

	if (total === 0) return null

	const current = highlights[currentIndex]
	const accent = ACCENTS[currentIndex % ACCENTS.length]
	const slideVariants = {
		enter: (step: number) => ({
			x: step > 0 ? 120 : -120,
			opacity: 0,
			scale: 0.96,
		}),
		center: { x: 0, opacity: 1, scale: 1, transition: { duration: 0.55 } },
		exit: (step: number) => ({
			x: step > 0 ? -120 : 120,
			opacity: 0,
			scale: 0.96,
			transition: { duration: 0.45 },
		}),
	}

	return (
		<section
			aria-labelledby="top-hottest-title"
			aria-roledescription="carousel"
			className="relative mb-20 overflow-visible pt-8 pb-12"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
		>
			<div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-1.5">
					<div
						className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-xs backdrop-blur-md"
						style={{ color: accent }}
					>
						<Flame className="size-3.5 fill-current" /> TOP HIGHLIGHTS
					</div>
					<h2
						id="top-hottest-title"
						className="flex items-center gap-3 text-2xl font-black tracking-tight text-foreground sm:text-4xl"
					>
						<span>热门内容精选</span>
						<span className="hidden text-sm font-normal text-muted-foreground sm:inline">
							文章与图片讨论
						</span>
					</h2>
				</div>
				{total > 1 && (
					<div className="flex items-center gap-2 self-end sm:self-auto">
						{highlights.map((item, index) => (
							<button
								key={item.type === 'post' ? item.post.id : item.image.id}
								type="button"
								onClick={() => {
									setDirection(index > currentIndex ? 1 : -1)
									setCurrentIndex(index)
								}}
								className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === currentIndex ? 'w-8' : 'w-2 bg-muted-foreground/30'}`}
								style={
									index === currentIndex
										? { backgroundColor: accent }
										: undefined
								}
								aria-label={`切换到第 ${index + 1} 个热门内容`}
							/>
						))}
						<Button
							variant="outline"
							size="icon"
							onClick={() => move(-1)}
							className="ml-2 size-9 rounded-full bg-background/80 backdrop-blur-md"
							aria-label="上一个热门内容"
						>
							<ArrowLeft className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							onClick={() => move(1)}
							className="size-9 rounded-full bg-background/80 backdrop-blur-md"
							aria-label="下一个热门内容"
						>
							<ArrowRight className="size-4" />
						</Button>
					</div>
				)}
			</div>

			<div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/90 shadow-2xl backdrop-blur-md">
				<AnimatePresence initial={false} custom={direction} mode="wait">
					<motion.div
						key={
							current.type === 'post'
								? `post-${current.post.id}`
								: `image-${current.image.id}`
						}
						custom={direction}
						variants={slideVariants}
						initial="enter"
						animate="center"
						exit="exit"
						className="grid min-h-105 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,1.05fr)]"
					>
						{current.type === 'post' ? (
							<PostHighlight post={current.post} accent={accent} />
						) : (
							<GalleryHighlight image={current.image} accent={accent} />
						)}
					</motion.div>
				</AnimatePresence>
			</div>
		</section>
	)
}

function HighlightTags({
	tags,
}: {
	tags: { name: string; slug: string; color: string | null }[] | string[]
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{tags.slice(0, 4).map((tag) => {
				const item =
					typeof tag === 'string' ? { name: tag, slug: tag, color: null } : tag
				return (
					<Badge
						key={item.slug}
						style={
							item.color
								? { backgroundColor: item.color, color: '#fff' }
								: undefined
						}
						className="px-2.5 py-0.5 text-xs"
					>
						{item.name}
					</Badge>
				)
			})}
		</div>
	)
}
function HighlightInfo({
	label,
	title,
	href,
	children,
	mediaOnLeft = false,
	accent,
}: {
	label: string
	title: string
	href: string
	children: React.ReactNode
	mediaOnLeft?: boolean
	accent: string
}) {
	return (
		<div
			className={`flex flex-col justify-between bg-card/90 p-6 sm:p-10 lg:p-12 ${mediaOnLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}
		>
			<div className="space-y-5">
				<span
					className="text-xs font-bold uppercase tracking-[0.2em]"
					style={{ color: accent }}
				>
					{label}
				</span>
				<NavigationLink href={href} className="block hover:text-primary">
					<h3 className="line-clamp-3 text-2xl font-black leading-snug tracking-tight sm:text-3xl">
						{title}
					</h3>
				</NavigationLink>
				{children}
			</div>
			<NavigationLink
				href={href}
				className="mt-6 inline-flex items-center gap-2 border-t border-border/60 pt-5 text-sm font-semibold hover:text-primary"
			>
				<span>查看详情</span>
				<ArrowRight className="size-4" />
			</NavigationLink>
		</div>
	)
}

function PostHighlight({
	post,
	accent,
}: {
	post: PostWithTags
	accent: string
}) {
	return (
		<>
			<HighlightInfo
				label="热门文章"
				title={post.title}
				href={`/posts/${post.slug}`}
				accent={accent}
				mediaOnLeft
			>
				<HighlightTags tags={post.tags ?? []} />
				<p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
					{post.excerpt || '暂无摘要描述...'}
				</p>
				{post.publishedAt && (
					<p className="text-xs text-muted-foreground">
						发布于 {formatPublishedDate(post.publishedAt.toISOString())}
					</p>
				)}
			</HighlightInfo>
			<NavigationLink
				href={`/posts/${post.slug}`}
				className="group relative order-1 min-h-70 overflow-hidden bg-muted lg:order-1 lg:aspect-4/3 lg:min-h-0"
			>
				<Image
					src={post.poster as string}
					alt={post.title}
					fill
					priority
					sizes="(max-width: 1024px) 100vw, 55vw"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
			</NavigationLink>
		</>
	)
}

function GalleryHighlight({
	image,
	accent,
}: {
	image: HomeGalleryImage
	accent: string
}) {
	return (
		<>
			<HighlightInfo
				label="热门讨论图片"
				title={image.title || image.galleryTitle}
				href={image.href}
				accent={accent}
			>
				<p className="text-sm text-muted-foreground">
					来自 Album：{image.galleryTitle}
				</p>
				<HighlightTags tags={image.tags} />
				{image.exif && (
					<p className="text-xs leading-6 text-muted-foreground">
						{[image.exif.make, image.exif.model, image.exif.capturedAt]
							.filter(Boolean)
							.join(' · ')}
					</p>
				)}
				<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
					<MessageCircle className="size-3.5" />
					{image.commentCount} 条讨论
				</span>
			</HighlightInfo>
			<NavigationLink
				href={image.href}
				className="group relative order-1 min-h-70 overflow-hidden bg-muted lg:order-2 lg:aspect-4/3 lg:min-h-0"
			>
				<Image
					src={image.imageUrl}
					alt={image.title || image.galleryTitle}
					fill
					priority
					sizes="(max-width: 1024px) 100vw, 55vw"
					className="object-cover transition-transform duration-700 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
			</NavigationLink>
		</>
	)
}
