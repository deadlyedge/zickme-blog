interface AdvancedPageTransitionProps {
	children: React.ReactNode
	className?: string
}

export function AdvancedPageTransition({
	children,
	className,
}: AdvancedPageTransitionProps) {
	return (
		<div
			className={`animate-in fade-in duration-200 ease-out fill-mode-forwards ${className || ''}`}
		>
			{children}
		</div>
	)
}
