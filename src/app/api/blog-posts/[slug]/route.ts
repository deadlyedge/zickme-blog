import { NextResponse } from 'next/server'
import { fetchBlogPostBySlug } from '@/lib/content-providers'

interface RouteParams {
	params: Promise<{
		slug: string
	}>
}

export async function GET(request: Request, { params }: RouteParams) {
	try {
		const { slug } = await params
		const post = await fetchBlogPostBySlug(slug)

		if (!post) {
			return NextResponse.json(
				{ error: 'Blog post not found' },
				{ status: 404 },
			)
		}

		return NextResponse.json(post)
	} catch (error) {
		console.error('Error fetching blog post:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch blog post' },
			{ status: 500 },
		)
	}
}
