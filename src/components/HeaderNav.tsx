import { ProfileViewModel } from '@/lib/content-providers'
import Link from 'next/link'

type HeaderNavProps = { profile: ProfileViewModel | null }

export const HeaderNav = ({ profile }: HeaderNavProps) => {
	return (
		<header className="fixed w-full top-0 z-40 h-16 bg-white/60 backdrop-blur border-b">
			<div className="mx-auto max-w-7xl px-6 py-3 h-16 flex items-center justify-between">
				<Link href="/" className="text-lg font-semibold tracking-tight">
					{profile?.website?.split('://')[1]?.replace(/\/$/, '') ?? 'Your Name'}
				</Link>

				<nav className="flex items-center gap-6">
					<Link
						href="/projects"
						className="text-sm text-slate-600 hover:text-slate-900">
						Projects
					</Link>
					<Link
						href="/blog"
						className="text-sm text-slate-600 hover:text-slate-900">
						Blog
					</Link>
					<Link
						href="/about"
						className="text-sm text-slate-600 hover:text-slate-900">
						Contact
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
