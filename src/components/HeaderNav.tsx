'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/button'
import { useProfile } from '@/hooks/useProfile'

export const HeaderNav = () => {
	const pathname = usePathname()
	// const { data: profile, isLoading } = useProfile()

	return (
		<nav className="fixed w-full top-0 z-40 h-16 bg-white/60 backdrop-blur border-b">
			<div className="mx-auto max-w-7xl px-6 py-3 h-16 flex items-center justify-between">
				<Link
					href="/"
					className={cn(
						'text-lg font-semibold tracking-tight',
						pathname === '/' && 'text-primary',
					)}>
					{/* {profile?.website?.split('://')[1]?.replace(/\/$/, '') ?? 'Your Name'} */}
					zick.me
				</Link>

				<nav className="flex items-center font-bold font-sans text-base">
					<Button
						asChild
						variant={pathname.startsWith('/projects') ? 'secondary' : 'link'}
						className="font-bold">
						<Link href="/projects">projects</Link>
					</Button>
					<Button
						asChild
						variant={pathname.startsWith('/blog') ? 'secondary' : 'link'}
						className="font-bold">
						<Link href="/blog">blog</Link>
					</Button>
					<Button
						asChild
						variant={pathname.startsWith('/about') ? 'secondary' : 'link'}
						className="font-bold">
						<Link href="/about">contact</Link>
					</Button>
					{/* <a
						href={profile?.website ?? '#'}
						className="ml-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:shadow transition">
						Contact
					</a> */}
				</nav>
			</div>
		</nav>
	)
}
