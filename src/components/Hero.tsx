'use client'

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
		x: 80,
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
			color: 'text-slate-900',
		},
		{ text: 'Crafting modern web apps and intelligent systems.' },
	]

	return (
		<section className="overflow-hidden">
			<div
				className="mx-auto w-full flex flex-col gap-y-20 justify-evenly max-w-7xl px-3 sm:px-6 py-20 min-h-[120vh]"
				style={{
					height: `${(3 + Number(profile?.slogans?.length || 3)) * 22}vh`,
				}}
			>
				{/* 背景标题：单独一个 scroll 动画块 */}
				<motion.div
					id="hero-title"
					className="flex items-start justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={blockVariantsH}
				>
					<span className="pointer-events-none text-5xl sm:text-7xl lg:text-8xl leading-none font-black tracking-tighter text-foreground/90 uppercase select-none">
						{profile?.title || 'ZICKME BLOG'}
					</span>
				</motion.div>

				{/* 1. 顶部 pill */}
				<motion.div
					id="top-pill"
					className="flex justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}
				>
					<Link
						href="/posts"
						className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 dark:bg-card/80 backdrop-blur-md px-5 py-2.5 text-xs font-semibold text-foreground shadow-sm hover:bg-background transition-all"
					>
						<span>探索全站文章与随笔</span>
						<span className="text-primary font-bold">→</span>
					</Link>
				</motion.div>

				{/* 2. 标语列表 */}
				{sloganList.map((slogan) => (
					<motion.div
						id={`slogan-${slogan.text}`}
						key={`slogan-${slogan.text}`}
						className="flex justify-start z-10"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariantsH}
					>
						<h2
							className={cn(
								'max-w-2xl text-2xl sm:text-4xl leading-snug font-extrabold text-foreground text-pretty uppercase tracking-tight',
								slogan.fontSize,
							)}
						>
							{slogan.text ||
								'A good design is not just a design, it is a future.'}
						</h2>
					</motion.div>
				))}

				{/* 3. 个人简介段落 */}
				<motion.div
					id="profile-bio"
					className="flex justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}
				>
					<p className="max-w-xl text-muted-foreground text-lg sm:text-2xl font-medium leading-relaxed">
						{profile?.bio ??
							'We craft impactful digital experiences for ambitious brands.'}
					</p>
				</motion.div>

				{/* 4. 底部曲线文字 */}
				<motion.div
					id="curved-text"
					className="flex h-36 items-center justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
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
