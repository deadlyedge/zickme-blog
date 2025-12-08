import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGravatarProfile } from '@/lib/getGravatar'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await request.headers,
		})

		if (!session?.user?.email) {
			return NextResponse.json(
				{ error: '未登录或邮箱不存在' },
				{ status: 401 }
			)
		}

		const user = session.user

		console.log(`[sync-gravatar] 用户信息: email=${user.email}, image=${user.image}, id=${user.id}`)

		// 如果已有头像，跳过
		// if (user.image) {
		// 	console.log('[sync-gravatar] 用户已有头像，跳过同步')
		// 	return NextResponse.json({
		// 		success: true,
		// 		message: '用户已有头像',
		// 	})
		// }

		const gravatarApiKey = process.env.GRAVATAR_API_KEY
		if (!gravatarApiKey) {
			console.log('[sync-gravatar] GRAVATAR_API_KEY 未设置')
			return NextResponse.json({
				success: true,
				message: 'Gravatar API key 未配置',
			})
		}

		console.log('[sync-gravatar] 调用 getGravatarProfile')
		const { avatarUrl } = await getGravatarProfile({
			email: user.email,
		})

		console.log(`[sync-gravatar] 获取到 avatarUrl: ${avatarUrl}`)

		if (avatarUrl) {
			console.log('[sync-gravatar] 更新用户头像')
			await prisma.user.update({
				where: { id: user.id },
				data: { image: avatarUrl },
			})
			console.log('[sync-gravatar] 用户头像更新成功')

			return NextResponse.json({
				success: true,
				message: '头像同步成功',
				avatarUrl,
			})
		} else {
			console.log('[sync-gravatar] 未获取到 avatarUrl')
			return NextResponse.json({
				success: true,
				message: '未找到 Gravatar 头像',
			})
		}
	} catch (error) {
		console.error('Gravatar sync error:', error)
		const message = error instanceof Error ? error.message : '同步失败'
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		)
	}
}
