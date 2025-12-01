'use client'

import { ProfileViewModel } from '@/lib/content-providers'
import Link from 'next/link'
import * as motion from 'motion/react-client'
import type { Variants } from 'motion/react'

type HeroProps = {
	profile: ProfileViewModel | null
}

const blockVariants: Variants = {
	offscreen: { opacity: 0, y: 80 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			bounce: 0.3,
			duration: 0.7,
		},
	},
}

export const Hero = ({ profile }: HeroProps) => {
	return (
		<section className="relative overflow-hidden">
			{/* 绿色背景撑高，内部使用 flex + 间距把元素分布开 */}
			<div className="mx-auto flex max-w-7xl flex-col px-6 py-24 bg-[#67a657] h-[260vh]">
				{/* 背景 JUICE：单独一个 scroll 动画块 */}
				<motion.div
					className="relative mb-24 flex flex-1 items-start justify-center"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.5, once: false }}
					variants={{
						offscreen: { opacity: 0, y: 120 },
						onscreen: {
							opacity: 0.2,
							y: 0,
							transition: { duration: 0.8, ease: 'easeOut' },
						},
					}}>
					<span className="pointer-events-none text-[18rem] leading-none font-extrabold text-cream">
						JUICE
					</span>
				</motion.div>

				{/* 1. 顶部 pill */}
				<motion.div
					className="mb-24 flex justify-center"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariants}>
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
					variants={blockVariants}>
					<h2 className="max-w-xl text-[3.2rem] leading-tight font-extrabold text-slate-900 lg:text-[4rem]">
						THE CREATIVE AGENCY THAT LOVES TO SHOW OFF A THING OR TWO.
					</h2>
				</motion.div>

				{/* 3. 段落 */}
				<motion.div
					className="mb-20 flex justify-start"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={blockVariants}>
					<p className="max-w-lg text-slate-900/90">
						{profile?.bio ??
							'We craft impactful digital experiences for ambitious brands.'}
					</p>
				</motion.div>

				{/* 4–6. 按钮 / 标签 / 次按钮 也拆成三个块 */}
				<div className="grid flex-1 gap-12 md:grid-cols-3">
					{/* 4. 主按钮 */}
					<motion.div
						className="flex items-center justify-start"
						initial="offscreen"
						whileInView="onscreen"
						viewport={{ amount: 0.7, once: false }}
						variants={blockVariants}>
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
						variants={blockVariants}>
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
						variants={blockVariants}>
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
				<motion.div
					className="mt-20 flex justify-center lg:justify-end"
					initial="offscreen"
					whileInView="onscreen"
					viewport={{ amount: 0.7, once: false }}
					variants={{
						offscreen: { opacity: 0, y: 80, scale: 0.8 },
						onscreen: {
							opacity: 1,
							y: 0,
							scale: 1,
							transition: {
								type: 'spring',
								bounce: 0.35,
								duration: 0.8,
							},
						},
					}}>
					<div className="flex h-80 w-80 items-center justify-center rounded-full border-8 border-white/80 bg-orange-400 shadow-2xl">
						<div className="text-6xl font-bold text-white">🏀</div>
					</div>
				</motion.div>
			</div>
		</section>
	)
}
