import { NextResponse } from 'next/server'
import { fetchHomeContent } from '@/lib/content-providers'

export async function GET() {
	try {
		const data = await fetchHomeContent()
		return NextResponse.json(data)
	} catch (error) {
		console.error('Error fetching home content:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch home content' },
			{ status: 500 }
		)
	}
}
