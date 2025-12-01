import { ProfileViewModel } from '@/lib/content-providers'
import AnimateOnMount from './AnimateOnMount'
import Link from 'next/link'

type HeroProps = {
	profile: ProfileViewModel | null
}

export const Hero = ({ profile }: HeroProps) => {
	return (
		<section className="relative overflow-hidden">
			{/* Top small CTA pill */}
			<div className="absolute inset-x-0 top-6 flex justify-center z-30">
				<a
					href="#"
					className="inline-flex items-center gap-2 bg-white/90 text-slate-900 px-4 py-2 rounded-full text-xs font-medium shadow-sm">
					WE REBRANDED WITH PURPOSE. READ THE STORY →
				</a>
			</div>

			<div className="bg-[#67a657]">
				<div className="mx-auto max-w-7xl px-6 py-28 relative">
					{/* Decorative giant word behind */}
					<div className="pointer-events-none absolute inset-0 flex items-start">
						<AnimateOnMount delay={0} className="hidden lg:block">
							<span className="text-[22rem] leading-none font-extrabold text-cream opacity-20 -mt-10">
								JUICE
							</span>
						</AnimateOnMount>
					</div>

					<div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
						<div className="lg:col-span-6">
							<h2 className="text-[3.2rem] lg:text-[4rem] leading-tight font-extrabold text-slate-900 max-w-xl">
								THE CREATIVE AGENCY THAT LOVES TO SHOW OFF A THING OR TWO.
							</h2>

							<p className="mt-6 text-slate-900/90 max-w-lg">
								{profile?.bio ??
									'We craft impactful digital experiences for ambitious brands.'}
							</p>

							<div className="mt-8 flex items-center gap-4">
								<Link
									href="/projects"
									className="inline-flex items-center gap-3 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-95 transition">
									View projects
								</Link>
								<span className="ml-4 text-xs text-slate-900/70 tracking-widest">
									WORK • WEB • BRANDING
								</span>

								<a
									href={profile?.website ?? '#'}
									className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 px-4 py-3 text-sm font-medium text-slate-900/90 hover:bg-white/10 transition"
									target="_blank"
									rel="noreferrer">
									Visit website
								</a>
							</div>
						</div>

						<div className="lg:col-span-6 flex justify-center lg:justify-end">
							{/* Illustration / hero artwork placeholder */}
							<div className="w-80 h-80 rounded-full bg-orange-400 shadow-2xl border-8 border-white/80 flex items-center justify-center">
								<div className="text-6xl font-bold text-white">🏀</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
