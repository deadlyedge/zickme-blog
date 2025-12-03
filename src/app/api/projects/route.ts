import { NextResponse } from 'next/server'
import { fetchProjects } from '@/lib/content-providers'

export async function GET() {
	try {
		const projects = await fetchProjects()
		return NextResponse.json(projects)
	} catch (error) {
		console.error('Error fetching projects:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch projects' },
			{ status: 500 }
		)
	}
}
