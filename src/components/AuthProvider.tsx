'use client'

import { useEffect, ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

interface AuthProviderProps {
	children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
	const { checkAuth } = useAppStore()

	// 检查认证状态 - 应用加载时立即执行
	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	// 设置焦点和可见性变化监听器以重新验证会话
	useEffect(() => {
		const handleFocus = () => {
			checkAuth()
		}

		const handleVisibilityChange = () => {
			if (!document.hidden) {
				checkAuth()
			}
		}

		// 添加事件监听器
		window.addEventListener('focus', handleFocus)
		document.addEventListener('visibilitychange', handleVisibilityChange)

		// 清理函数
		return () => {
			window.removeEventListener('focus', handleFocus)
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
	}, [checkAuth])

	return <>{children}</>
}
