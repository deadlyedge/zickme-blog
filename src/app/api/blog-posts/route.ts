import { NextResponse } from 'next/server'
import { fetchBlogPosts } from '@/lib/content-providers'

export async function GET() {
	try {
		const posts = await fetchBlogPosts()
		return NextResponse.json(posts)
	} catch (error) {
		console.error('Error fetching blog posts:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch blog posts' },
			{ status: 500 }
		)
	}
}
