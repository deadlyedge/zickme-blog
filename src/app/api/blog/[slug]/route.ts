import { NextRequest, NextResponse } from 'next/server'
import { fetchBlogPostBySlug } from '@/lib/content-providers'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params
		const post = await fetchBlogPostBySlug(slug)

		if (!post) {
			return NextResponse.json({ error: 'Post not found' }, { status: 404 })
		}

		return NextResponse.json(post)
	} catch (error) {
		console.error('Error fetching blog post:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
