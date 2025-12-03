'use client'

import { ProfileViewModel } from '@/lib/content-providers'
import * as motion from 'motion/react-client'
import { useMotionValueEvent } from 'motion/react'
import type { MotionStyle, MotionValue, Variants } from 'motion/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import CurvedLoop from './ui/effects/CurvedLoop'

type HeroProps = {
	profile: ProfileViewModel | null
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
		scale: scaleValue < 0.5 ? 1 - scaleValue : 0.8,
		opacity: scaleValue < 0.5 ? 1 - scaleValue * 2 : 1,
		x: scaleValue * 200,
		y: scaleValue < 0.5 ? 0 : (scaleValue - 0.5) * 100,
		rotate: scaleValue < 0.5 ? 0 : (scaleValue - 0.5) * 360 * 2,
	}

	const sloganList = profile?.slogans || []

	return (
		<section className="overflow-hidden">
			{/* 绿色背景撑高，内部使用 flex + 间距把元素分布开 */}
			<div className="mx-auto w-full flex flex-col gap-y-20 justify-evenly max-w-7xl px-3 sm:px-6 py-24 bg-linear-to-b from-[hsl(108,31%,50%)] via-[hsl(108,31%,50%)] to-[hsl(108,31%,80%)] h-[300vh]">
				<div
					className={cn(
						'fixed top-36 left-36 z-0 select-none',
						scaleValue > 0.5 ? '-z-10' : '',
					)}>
					<motion.div
						className="flex h-80 w-80 items-center justify-center rounded-full border-8 border-white/80 bg-orange-400 shadow-2xl"
						style={style}>
						<div className="text-6xl font-bold text-white">🏀</div>
					</motion.div>
				</div>
				{/* 背景 JUICE：单独一个 scroll 动画块 */}
				<motion.div
					className="flex flex-1 items-start justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={blockVariantsH}>
					<span className="pointer-events-none text-6xl leading-none font-extrabold">
						{profile?.name || 'JUICE'}
					</span>
				</motion.div>
				<motion.div
					className="flex flex-1 items-start justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={blockVariantsH}>
					<span className="pointer-events-none text-4xl leading-none font-bold">
						{profile?.title || 'JUICE'}
					</span>
				</motion.div>

				{/* 1. 顶部 pill */}
				<motion.div
					id="slogan-0"
					className="flex justify-center z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<a
						href="#projects"
						className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm">
						{sloganList[0].text ||
							'WE REBRANDED WITH PURPOSE. READ THE STORY →'}
					</a>
				</motion.div>

				{/* 2. 标题 */}
				<motion.div
					id="slogan-1"
					className="flex justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<h2
						className={cn(
							'max-w-xl lg:max-w-md text-3xl leading-tight font-extrabold text-slate-900 text-pretty uppercase',
							sloganList[1].fontSize,
							`text-${sloganList[1].color}`,
						)}>
						{sloganList[1].text ||
							'A good design is not just a design, it is a future.'}
					</h2>
				</motion.div>

				{/* 3. 段落 */}
				<motion.div
					className="flex justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<p className="max-w-lg text-slate-900/90 text-2xl">
						{profile?.bio ??
							'We craft impactful digital experiences for ambitious brands.'}
					</p>
				</motion.div>

				{/* 4–6. 按钮 / 标签 / 次按钮 也拆成三个块 */}
				{/* 5. 标签 */}
				<motion.div
					id="slogan-2"
					className="flex h-40 items-center justify-start z-10"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<CurvedLoop
						marqueeText={
							sloganList[2].text || 'We are a team of designers and developers.'
						}
						speed={1}
						curveAmount={300}
						className="fill-lime-700"
					/>
				</motion.div>
			</div>
		</section>
	)
}
