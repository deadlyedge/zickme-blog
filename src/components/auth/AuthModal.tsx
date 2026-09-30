'use client'

import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '@/lib/auth-client'
import { useAppStore } from '@/lib/store'
import type { AuthTab } from './auth-form-schemas'
import { LoginForm } from './LoginForm'
import { ProfileForm } from './ProfileForm'
import { RegisterForm } from './RegisterForm'

export default function AuthModal() {
	const isAuthModalOpen = useAppStore((state) => state.isAuthModalOpen)
	const authModalView = useAppStore((state) => state.authModalView)
	const closeAuthModal = useAppStore((state) => state.closeAuthModal)
	const session = useSession()
	const user = session.data?.user
	const isLoggedIn = Boolean(user)
	const [activeTab, setActiveTab] = useState<AuthTab>(authModalView)

	useEffect(() => {
		setActiveTab(authModalView)
	}, [authModalView])

	const handleTabChange = (value: string) => {
		setActiveTab(value as AuthTab)
	}

	// const handleSignOut = async () => {
	// 	setSignOutError(null)
	// 	setIsSigningOut(true)

	// 	try {
	// 		const result = await signOut()
	// 		if (result.error) {
	// 			throw new Error(result.error.message || '登出失败')
	// 		}
	// 		closeAuthModal()
	// 	} catch (error) {
	// 		setSignOutError(error instanceof Error ? error.message : '登出失败')
	// 	} finally {
	// 		setIsSigningOut(false)
	// 	}
	// }

	return (
		<Dialog open={isAuthModalOpen} onOpenChange={closeAuthModal}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="items-center text-center space-y-2">
					<BrandLogo size={36} textClassName="text-xl font-black" />
					<DialogTitle>{isLoggedIn ? '账户信息' : '用户认证'}</DialogTitle>
					<DialogDescription>
						{isLoggedIn
							? '你已登录，随时在评论区发表想法或管理站点。'
							: '登录或注册账户以发表评论'}
					</DialogDescription>
				</DialogHeader>
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="w-full"
				>
					{isLoggedIn ? (
						<>
							<TabsContent value="profile" className="mt-4">
								<ProfileForm onSuccess={closeAuthModal} />
							</TabsContent>
							{/* 
						<div className="space-y-4">
							<p className="text-sm text-slate-700">
								{user?.name || user?.email}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={handleSignOut}
								disabled={isSigningOut}>
								{isSigningOut ? '登出中...' : '登出'}
							</Button>
							{signOutError && (
								<p className="text-sm text-destructive">{signOutError}</p>
							)}
						</div> */}
						</>
					) : (
						<>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="login">登录</TabsTrigger>
								<TabsTrigger value="register">注册</TabsTrigger>
							</TabsList>

							<TabsContent value="login" className="mt-4">
								<LoginForm onSuccess={closeAuthModal} />
							</TabsContent>

							<TabsContent value="register" className="mt-4">
								<RegisterForm onSuccess={closeAuthModal} />
							</TabsContent>
						</>
					)}
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
