import Image from 'next/image'
import type React from 'react'
import { cn } from '@/lib/utils'

interface BrandLogoProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: number
	showText?: boolean
	textClassName?: string
}

export function BrandLogo({
	size = 28,
	showText = true,
	className,
	textClassName,
	...props
}: BrandLogoProps) {
	return (
		<div
			className={cn(
				'inline-flex items-center gap-2.5 select-none transition-transform duration-300 group',
				className,
			)}
			{...props}
		>
			<div
				className="relative shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-xs"
				style={{ width: size, height: size }}
			>
				<Image
					src="/zick.logo.svg"
					alt="Zick Logo"
					width={size}
					height={size}
					className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
					priority
				/>
			</div>

			{showText && (
				<span
					className={cn(
						'font-black font-sans tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary',
						textClassName,
					)}
				>
					zick<span className="text-primary">.me</span>
				</span>
			)}
		</div>
	)
}
