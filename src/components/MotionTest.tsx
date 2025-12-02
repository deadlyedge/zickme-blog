'use client'

import {
	motion,
	MotionValue,
	useScroll,
	useSpring,
	useTransform,
} from 'motion/react'
import { RefObject, useRef } from 'react'

const gradient = (mask: boolean) =>
	`conic-gradient(black 0%, black ${mask ? 0 : 100}%, transparent ${
		mask ? 0 : 100
	}%, transparent 100%)`

function Item({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
	// const { scrollYProgress } = useScroll({
	// 	target: scrollRef,
	// 	offset: ['0 0.75', '0.5 0.6'],
	// })
	const smoothed = useSpring(scrollYProgress, {
		damping: 30,
		stiffness: 100,
		restDelta: 0.001,
	})
	const maskImage = useTransform(
		smoothed,
		[0, 1],
		[gradient(true), gradient(false)],
	)
	return (
		<section style={itemContainer} className="bg-blue-300 w-40 h-60 relative">
			<motion.div
				style={{
					WebkitMaskImage: maskImage,
					maskImage,
					width: '10rem',
					height: '15rem',
				}}>
				<div className="absolute inset-0 bg-amber-600" />
			</motion.div>
		</section>
	)
}

export default function MotionTest({
	scrollRef,
	scrollYProgress
}: {
	scrollRef?: RefObject<HTMLElement | null>
	scrollYProgress: MotionValue<number>
}) {
	// const { scrollYProgress } = useScroll({
	// 	target: scrollRef,
	// 	offset: ['0 0.75', '0.5 0.6'],
	// })
	return (
		<div>
			{[...Array(5)].map((_, i) => (
				<div key={i}>
					<Item scrollYProgress={scrollYProgress} />
				</div>
			))}
		</div>
	)
}

/**
 * ==============   Styles   ================
 */

const itemContainer: React.CSSProperties = {
	height: '100vh',
	maxHeight: '400px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	overflow: 'hidden',
	position: 'relative',
}
