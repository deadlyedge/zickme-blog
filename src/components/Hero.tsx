'use client'

import { ProfileViewModel } from '@/lib/content-providers'
import Link from 'next/link'
import * as motion from 'motion/react-client'
import type { MotionValue, Variants } from 'motion/react'

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
	return (
		<section className="overflow-hidden">
			{/* 绿色背景撑高，内部使用 flex + 间距把元素分布开 */}
			<div className="mx-auto w-full flex max-w-7xl flex-col px-3 sm:px-6 py-24 bg-linear-to-b from-[hsl(108,31%,50%)] via-[hsl(108,31%,50%)] to-[hsl(108,31%,80%)] h-[260vh] relative">
				<div className="fixed top-36 left-16 ">
					<motion.div
						className="flex h-80 w-80 items-center justify-center rounded-full border-8 border-white/80 bg-orange-400 shadow-2xl"
						style={{ scale }}>
						<div className="text-6xl font-bold text-white">🏀</div>
					</motion.div>
				</div>
				{/* 背景 JUICE：单独一个 scroll 动画块 */}
				<motion.div
					className="relative mb-24 flex flex-1 items-start justify-center"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={blockVariantsH}>
					<span className="pointer-events-none text-8xl sm:text-[12rem] leading-none font-extrabold">
						JUICE
					</span>
				</motion.div>

				{/* 1. 顶部 pill */}
				<motion.div
					className="my-40 flex justify-center"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<a
						href="#"
						className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm">
						WE REBRANDED WITH PURPOSE. READ THE STORY →
					</a>
				</motion.div>

				{/* 2. 标题 */}
				<motion.div
					className="mb-20 flex justify-start"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariantsH}>
					<h2 className="max-w-xl lg:max-w-md text-3xl leading-tight font-extrabold text-slate-900 text-pretty">
						THE CREATIVE AGENCY THAT LOVES TO SHOW OFF A THING OR TWO.
					</h2>
				</motion.div>

				{/* 3. 段落 */}
				<motion.div
					className="mb-20 flex justify-start"
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
				<div className="grid flex-1 gap-12 md:grid-cols-4">
					{/* 4. 主按钮 */}
					<motion.div
						className="flex items-center justify-start"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariantsH}>
						<Link
							href="/projects"
							className="inline-flex items-center gap-3 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 transition">
							View projects
						</Link>
					</motion.div>

					{/* 5. 标签 */}
					<motion.div
						className="flex items-center justify-start"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariantsH}>
						<span className="text-xs tracking-widest text-slate-900/80">
							WORK • WEB • BRANDING
						</span>
					</motion.div>

					{/* 6. 次按钮 */}
					<motion.div
						className="flex items-center justify-start"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariantsH}>
						<a
							href={profile?.website ?? '#'}
							className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 px-4 py-3 text-sm font-medium text-slate-900/90 hover:bg-white/10 transition"
							target="_blank"
							rel="noreferrer">
							Visit website
						</a>
					</motion.div>
				</div>

				{/* 7. 右侧插画：放在最底部，最后一个进入/退出 */}
				{/* <motion.div
					className="mt-20 flex justify-center lg:justify-end"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.2, once: false }}
					variants={{
						offscreen: { opacity: 0, x: -80, scale: 0.8 },
						onscreen: {
							opacity: 1,
							x: 0,
							scale: 1,
							transition: {
								type: 'spring',
								bounce: 0.5,
								duration: 1.8,
							},
						},
					}}>
					<div className="flex h-80 w-80 items-center justify-center rounded-full border-8 border-white/80 bg-orange-400 shadow-2xl">
						<div className="text-6xl font-bold text-white">🏀</div>
					</div>
				</motion.div> */}
			</div>
		</section>
	)
}
