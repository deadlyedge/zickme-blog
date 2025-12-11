import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		if (!session?.user?.id || session.user.role !== 'ADMIN') {
			return NextResponse.json(
				{ error: '需要管理员权限' },
				{ status: 403 }
			)
		}

		const profile = await prisma.siteProfile.findFirst()

		return NextResponse.json({
			profile,
		})
	} catch (error) {
		console.error('Get site profile error:', error)
		return NextResponse.json(
			{ error: '获取站点资料失败' },
			{ status: 500 }
		)
	}
}
