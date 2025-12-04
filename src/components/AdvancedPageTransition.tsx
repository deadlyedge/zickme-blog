'use client'

import { useAppStore } from '@/lib/store'

interface AdvancedPageTransitionProps {
	children: React.ReactNode
}

export function AdvancedPageTransition({
	children,
}: AdvancedPageTransitionProps) {
	const { isNavigating, loadingStates } = useAppStore()

	// 检查是否有任何数据正在加载
	const isAnyLoading = Object.values(loadingStates).some((loading) => loading)

	// 如果正在导航或加载数据，显示骨架屏
	if (isNavigating || isAnyLoading) {
		return (
			<div className="min-h-screen animate-pulse">
				{/* 骨架屏 */}
				<div className="space-y-4 p-6">
					{/* 标题骨架 */}
					<div className="h-8 bg-gray-200 rounded w-3/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>

					{/* 内容骨架 */}
					<div className="space-y-3">
						<div className="h-4 bg-gray-200 rounded"></div>
						<div className="h-4 bg-gray-200 rounded w-5/6"></div>
						<div className="h-4 bg-gray-200 rounded w-4/6"></div>
						<div className="h-4 bg-gray-200 rounded w-3/6"></div>
					</div>

					{/* 卡片骨架 */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="bg-gray-100 rounded-lg p-4">
								<div className="h-32 bg-gray-200 rounded mb-4"></div>
								<div className="h-4 bg-gray-200 rounded mb-2"></div>
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
							</div>
						))}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div
			className={`
				transition-all duration-500 ease-out
				${isAnyLoading ? 'pointer-events-none' : 'pointer-events-auto'}
			`}>
			{/* 加载进度条 */}
			{isAnyLoading && (
				<div className="fixed top-0 left-0 right-0 z-50">
					<div className="h-1 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
				</div>
			)}

			{/* 主要内容 */}
			<div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
				{children}
			</div>
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
