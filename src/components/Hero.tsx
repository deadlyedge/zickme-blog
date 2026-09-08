'use client'

import { Sparkles } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SiteProfile } from '@/types'
import CurvedLoop from './ui/effects/CurvedLoop'

type HeroProps = {
	profile: SiteProfile | null
}

const blockVariantsH: Variants = {
	offscreen: {
		opacity: 0,
		x: 60,
		transition: {
			type: 'spring',
			bounce: 0.2,
			duration: 0.4,
		},
	},
	onscreen: {
		opacity: 1,
		x: 0,
		transition: {
			type: 'tween',
			bounce: 0.8,
			duration: 0.8,
		},
	},
}

export const Hero = ({ profile }: HeroProps) => {
	const sloganList = profile?.slogans || [
		{ text: 'EXPLORE THOUGHTS & INSPIRATIONS. READ THE BLOG →' },
		{
			text: 'A good design is not just a design, it is a future.',
			fontSize: 'text-3xl',
		},
		{ text: 'Crafting modern web apps and intelligent systems.' },
	]

	return (
		<section className="overflow-hidden py-12 sm:py-20 relative">
			<div
				className="mx-auto w-full flex flex-col gap-y-16 sm:gap-y-24 justify-evenly max-w-7xl px-3 sm:px-6 min-h-[110vh]"
				style={{
					height: `${(3 + Number(profile?.slogans?.length || 3)) * 20}vh`,
				}}
			>
				{/* 1. 背景标题：主标题 + 柔和文本阴影与微光 */}
				<motion.div
					id="hero-title"
					className="flex items-start justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.4, once: false }}
					variants={blockVariantsH}
				>
					<div className="relative group">
						<span className="pointer-events-none text-5xl sm:text-7xl lg:text-8xl leading-none font-black tracking-tighter text-foreground uppercase select-none drop-shadow-sm sm:drop-shadow-md">
							{profile?.title || 'ZICKME BLOG'}
						</span>
						<span className="absolute -bottom-2 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/40 to-transparent blur-xs opacity-70" />
					</div>
				</motion.div>

				{/* 2. 顶部 pill 导引 */}
				<motion.div
					id="top-pill"
					className="flex justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.6, once: false }}
					variants={blockVariantsH}
				>
					<Link
						href="/posts"
						className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-background/85 dark:bg-card/85 backdrop-blur-md px-6 py-2.5 text-xs sm:text-sm font-bold text-foreground shadow-sm hover:border-primary/50 hover:bg-background transition-all hover:scale-105"
					>
						<Sparkles className="size-3.5 text-primary animate-pulse" />
						<span className="tracking-wide">探索全站文章与随笔</span>
						<span className="text-primary font-bold">→</span>
					</Link>
				</motion.div>

				{/* 3. 标语列表（Badge + 毛玻璃与高对比度强化） */}
				{sloganList.map((slogan, idx) => (
					<motion.div
						id={`slogan-${idx}`}
						key={`slogan-${slogan.text}`}
						className="flex justify-start z-10"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.6, once: false }}
						variants={blockVariantsH}
					>
						<div className="inline-block max-w-3xl rounded-2xl border border-border/60 bg-background/70 dark:bg-card/70 backdrop-blur-md px-5 py-4 sm:px-8 sm:py-6 shadow-sm hover:border-primary/30 transition-all">
							<h2
								className={cn(
									'text-xl sm:text-3xl lg:text-4xl leading-snug font-extrabold text-foreground text-pretty uppercase tracking-tight drop-shadow-2xs',
									slogan.fontSize,
								)}
							>
								{slogan.text ||
									'A good design is not just a design, it is a future.'}
							</h2>
						</div>
					</motion.div>
				))}

				{/* 4. 个人简介段落（增强背景与对比度） */}
				<motion.div
					id="profile-bio"
					className="flex justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.6, once: false }}
					variants={blockVariantsH}
				>
					<div className="max-w-2xl rounded-2xl border border-border/50 bg-background/60 dark:bg-card/60 backdrop-blur-sm p-5 sm:p-6 shadow-xs">
						<p className="text-foreground/80 text-base sm:text-xl font-medium leading-relaxed drop-shadow-2xs">
							{profile?.bio ??
								'We craft impactful digital experiences for ambitious brands.'}
						</p>
					</div>
				</motion.div>

				{/* 5. 底部曲线文字 */}
				<motion.div
					id="curved-text"
					className="flex h-36 items-center justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.6, once: false }}
					variants={blockVariantsH}
				>
					<CurvedLoop
						marqueeText={'INNOVATION • ENGINEERING • DESIGN • AI AGENTS • '}
						speed={1}
						curveAmount={260}
						className="fill-primary/80 font-bold"
					/>
				</motion.div>
			</div>
		</section>
	)
}
