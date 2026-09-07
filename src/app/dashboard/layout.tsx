import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({
	children,
}: {
	children: ReactNode
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id || session.user.role !== 'ADMIN') {
		redirect('/')
	}

	return <>{children}</>
}
