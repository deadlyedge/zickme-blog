import { NextRequest, NextResponse } from 'next/server'
import { getComments, createComment } from '@/lib/actions/comments'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const docId = parseInt(searchParams.get('docId') || '0')
		const docType = searchParams.get('docType') as 'posts' | 'projects'

		if (!docId || !docType || (docType !== 'posts' && docType !== 'projects')) {
			return NextResponse.json(
				{ error: 'Invalid docId or docType' },
				{ status: 400 }
			)
		}

		const comments = await getComments(docId, docType)
		return NextResponse.json(comments)
	} catch (error) {
		console.error('Error fetching comments:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch comments' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()

		const result = await createComment({
			content: body.content,
			docId: body.docId,
			docType: body.docType,
			parentId: body.parentId,
			authorName: body.authorName,
			authorEmail: body.authorEmail,
			path: body.path,
		})

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error },
				{ status: 400 }
			)
		}

		return NextResponse.json(result.comment)
	} catch (error) {
		console.error('Error creating comment:', error)
		return NextResponse.json(
			{ error: 'Failed to create comment' },
			{ status: 500 }
		)
	}
}
