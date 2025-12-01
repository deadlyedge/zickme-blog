'use client'

import { ProfileViewModel } from '@/lib/content-providers'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type HeaderNavProps = { profile: ProfileViewModel | null }

export const HeaderNav = ({ profile }: HeaderNavProps) => {
	const pathname = usePathname()

	return (
		<header className="fixed w-full top-0 z-40 h-16 bg-white/60 backdrop-blur border-b">
			<div className="mx-auto max-w-7xl px-6 py-3 h-16 flex items-center justify-between">
				<Link href="/" className={cn("text-lg font-semibold tracking-tight", pathname === '/' && 'text-primary')}>
					{profile?.website?.split('://')[1]?.replace(/\/$/, '') ?? 'Your Name'}
				</Link>

				<nav className='flex items-center gap-6 font-bold font-sans text-base'>
					<Link
						href="/projects"
						className={cn("text-slate-600 hover:text-slate-900", pathname.startsWith('/projects') && 'text-primary')}>
						projects
					</Link>
					<Link
						href="/blog"
						className={cn("text-slate-600 hover:text-slate-900", pathname.startsWith('/blog') && 'text-primary')}>
						blog
					</Link>
					<Link
						href="/about"
						className={cn("text-slate-600 hover:text-slate-900", pathname.startsWith('/about') && 'text-primary')}>
						contact
					</Link>
					{/* <a
						href={profile?.website ?? '#'}
						className="ml-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:shadow transition">
						Contact
					</a> */}
				</nav>
			</div>
		</header>
	)
}
