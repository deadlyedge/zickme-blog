import { NextResponse } from 'next/server'
import { fetchContent } from '@/lib/content-providers'

interface RouteParams {
	params: Promise<{
		slug: string
	}>
}

export async function GET(request: Request, { params }: RouteParams) {
	try {
		const { slug } = await params
		const { projects } = await fetchContent()

		const project = projects.find((p) => p.slug === slug)

		if (!project) {
			return NextResponse.json({ error: 'Project not found' }, { status: 404 })
		}

		return NextResponse.json(project)
	} catch (error) {
		console.error('Error fetching project:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch project' },
			{ status: 500 },
		)
	}
}
