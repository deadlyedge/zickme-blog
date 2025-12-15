interface AdvancedPageTransitionProps {
	children: React.ReactNode
}

export function AdvancedPageTransition({
	children,
}: AdvancedPageTransitionProps) {
	// Simplified component - loading states are now handled by TanStack Query in individual components
	return (
		<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
			{children}
		</div>
	)
}

// 自定义动画keyframes (需要在globals.css中添加)
/*
@keyframes slide-in-from-bottom {
  from {
    transform: translateY(1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in-from-bottom 0.3s ease-out;
}
*/
