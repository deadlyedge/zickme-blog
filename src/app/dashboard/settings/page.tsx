import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { fetchPosts, fetchProfile } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'
import { SettingsClient } from './SettingsClient'

export const metadata: Metadata = buildMetadata({
	title: 'Site Settings & Customizer - Dashboard',
	description:
		'Customize theme styles, landing page modules, and about page details.',
})

export default async function SettingsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id || session.user.role !== 'ADMIN') {
		redirect('/')
	}

	const [profile, allPosts] = await Promise.all([
		fetchProfile(),
		fetchPosts(100),
	])

	return <SettingsClient initialProfile={profile} allPosts={allPosts} />
}
