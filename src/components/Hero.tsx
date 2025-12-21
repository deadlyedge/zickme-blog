'use client'

import type { MotionStyle, MotionValue, Variants } from 'motion/react'
import { useMotionValueEvent } from 'motion/react'
import * as motion from 'motion/react-client'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SiteProfile } from '@/types'
import CurvedLoop from './ui/effects/CurvedLoop'

type HeroProps = {
	profile: SiteProfile | null
	scale: MotionValue<number>
}

const blockVariantsH: Variants = {
	offscreen: {
		opacity: 0,
		x: 120,
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
			duration: 1,
		},
	},
}

export const Hero = ({ profile, scale }: HeroProps) => {
	const [scaleValue, setScaleValue] = useState(0)
	useMotionValueEvent(scale, 'change', (value) => {
		setScaleValue(value)
	})

	const style: MotionStyle = {
		scale: scaleValue < 0.4 ? 1 - scaleValue : 0.6,
		opacity: 1,
		x: scaleValue * 200,
		y: scaleValue * 100,
		rotate: scaleValue * 360 * 2,
	}

	const sloganList = profile?.slogans || [
		{ text: 'WE REBRANDED WITH PURPOSE. READ THE STORY →' },
		{
			text: 'A good design is not just a design, it is a future.',
			fontSize: 'text-3xl',
			color: 'text-slate-900',
		},
		{ text: 'We are a team of designers and developers.' },
	]

	return (
		<section className="overflow-hidden">
			{/* 绿色背景撑高，内部使用 flex + 间距把元素分布开 */}
			<div
				className="mx-auto w-full flex flex-col gap-y-20 justify-evenly max-w-7xl px-3 sm:px-6 py-24 h-[300vh]"
				style={{ height: `${(6 + Number(profile?.slogans?.length)) * 30}vh` }}
			>
				<div
					className={cn(
						'fixed top-36 left-36 z-0 select-none',
						scaleValue > 0.5 ? '-z-10' : '',
					)}
				>
					<motion.div
						id="hero-ball"
						className="flex h-80 w-80 items-center justify-center rounded-full border-8 border-white/80 bg-orange-400 shadow-2xl"
						style={style}
					>
						<div className="text-8xl font-bold text-white">🏀</div>
					</motion.div>
				</div>
				{/* 背景 JUICE：单独一个 scroll 动画块 */}
				<motion.div
					id="hero-title"
					className="flex items-start justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={blockVariantsH}
				>
					<span className="pointer-events-none text-6xl leading-none font-extrabold">
						{profile?.title || 'JUICE'}
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
						href="/projects"
						className="inline-flex items-center gap-2 bg-white/90 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm"
					>
						查看我的项目 →
					</Link>
				</motion.div>

				{/* 2. 标题 */}
				{sloganList.map((slogan, index) => (
					<motion.div
						id={`slogan-${index + 1}`}
						key={`slogan-${index + 1}`}
						className="flex justify-start z-10"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariantsH}
					>
						<h2
							className={cn(
								'max-w-xl lg:max-w-md text-3xl leading-tight font-extrabold text-slate-900 text-pretty uppercase',
								slogan.fontSize,
								`text-${slogan.color}`,
							)}
						>
							{slogan.text ||
								'A good design is not just a design, it is a future.'}
						</h2>
					</motion.div>
				))}

				{/* 3. 段落 */}
				<motion.div
					id="profile-bio"
					className="flex justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}
				>
					<p className="max-w-lg text-slate-900/90 text-2xl">
						{profile?.bio ??
							'We craft impactful digital experiences for ambitious brands.'}
					</p>
				</motion.div>

				{/* 4–6. 按钮 / 标签 / 次按钮 也拆成三个块 */}
				{/* 5. 标签 */}
				<motion.div
					id="curved-text"
					className="flex h-40 items-center justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}
				>
					<CurvedLoop
						marqueeText={'We are a team of designers and developers.'}
						speed={1}
						curveAmount={300}
						className="fill-lime-700"
					/>
				</motion.div>
			</div>
		</section>
	)
}
