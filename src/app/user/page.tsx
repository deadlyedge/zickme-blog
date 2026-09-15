import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserPortalClient } from '@/components/UserPortalClient'
import { getUserPortalData } from '@/lib/actions/user-portal'
import { auth } from '@/lib/auth'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
	title: 'User Center - Profile & Comments',
	description:
		'Manage personal profile, view comments history and reply notifications.',
})

export default async function UserPortalPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		redirect('/')
	}

	const data = await getUserPortalData()

	return <UserPortalClient initialData={data} />
}
