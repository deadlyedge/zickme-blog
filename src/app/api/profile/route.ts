import { NextResponse } from 'next/server'
import { fetchProfile } from '@/lib/content-providers'

export async function GET() {
	try {
		const profile = await fetchProfile()
		return NextResponse.json(profile)
	} catch (error) {
		console.error('Error fetching profile:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch profile' },
			{ status: 500 }
		)
	}
}
