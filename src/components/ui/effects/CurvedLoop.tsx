import { cn } from '@/lib/utils'
import { useRef, useEffect, useState, useMemo, useId, FC } from 'react'

interface CurvedLoopProps {
	marqueeText?: string
	speed?: number
	className?: string
	curveAmount?: number
	direction?: 'left' | 'right'
}

const CurvedLoop: FC<CurvedLoopProps> = ({
	marqueeText = '',
	speed = 2,
	className,
	curveAmount = 400,
	direction = 'left',
}) => {
	const text = useMemo(() => {
		const hasTrailing = /\s|\u00A0$/.test(marqueeText)
		return (
			(hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText) + '\u00A0'
		)
	}, [marqueeText])

	const measureRef = useRef<SVGTextElement | null>(null)
	const textPathRef = useRef<SVGTextPathElement | null>(null)
	const pathRef = useRef<SVGPathElement | null>(null)
	const [spacing, setSpacing] = useState(0)
	const uid = useId()
	const pathId = `curve-${uid}`
	const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`

	const dragRef = useRef(false)
	const dirRef = useRef<'left' | 'right'>(direction)

	const textLength = spacing
	const totalText = textLength
		? Array(Math.ceil(1800 / textLength) + 2)
				.fill(text)
				.join('')
		: text
	const ready = spacing > 0

	useEffect(() => {
		if (measureRef.current)
			setSpacing(measureRef.current.getComputedTextLength())
	}, [text, className])

	useEffect(() => {
		if (!spacing) return
		if (textPathRef.current) {
			const initial = -spacing
			textPathRef.current.setAttribute('startOffset', initial + 'px')
		}
	}, [spacing])

	useEffect(() => {
		if (!spacing || !ready) return
		let frame = 0
		const step = () => {
			if (!dragRef.current && textPathRef.current) {
				const delta = dirRef.current === 'right' ? speed : -speed
				const currentOffset = parseFloat(
					textPathRef.current.getAttribute('startOffset') || '0',
				)
				let newOffset = currentOffset + delta
				const wrapPoint = spacing
				if (newOffset <= -wrapPoint) newOffset += wrapPoint
				if (newOffset > 0) newOffset -= wrapPoint
				textPathRef.current.setAttribute('startOffset', newOffset + 'px')
			}
			frame = requestAnimationFrame(step)
		}
		frame = requestAnimationFrame(step)
		return () => cancelAnimationFrame(frame)
	}, [spacing, speed, ready])

	const cursorStyle = 'auto'

	return (
		<div
			className="min-h-screen flex items-center justify-center w-full"
			style={{ visibility: ready ? 'visible' : 'hidden', cursor: cursorStyle }}>
			<svg
				className="select-none w-full overflow-visible block aspect-100/12 text-[6rem] font-bold uppercase leading-none"
				viewBox="0 0 1440 120">
				<text
					ref={measureRef}
					xmlSpace="preserve"
					style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}>
					{text}
				</text>
				<defs>
					<path
						ref={pathRef}
						id={pathId}
						d={pathD}
						fill="none"
						stroke="transparent"
					/>
				</defs>
				{ready && (
					<text xmlSpace="preserve" className={cn('fill-white', className)}>
						<textPath ref={textPathRef} href={`#${pathId}`} xmlSpace="preserve">
							{totalText}
						</textPath>
					</text>
				)}
			</svg>
		</div>
	)
}

export default CurvedLoop
