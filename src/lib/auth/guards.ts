import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const DEFAULT_SESSION_ERROR = '用户未登录'
const DEFAULT_ADMIN_ERROR = '权限不足：需要管理员权限'

async function getCurrentSession() {
	return auth.api.getSession({ headers: await headers() })
}

/** 获取当前登录会话；未登录时抛出指定错误。 */
export async function requireSession(errorMessage = DEFAULT_SESSION_ERROR) {
	const session = await getCurrentSession()
	if (!session?.user?.id) throw new Error(errorMessage)
	return session
}

/** 获取当前管理员会话；未登录或非管理员时抛出指定错误。 */
export async function requireAdminSession(errorMessage = DEFAULT_ADMIN_ERROR) {
	const session = await getCurrentSession()
	if (!session?.user?.id || session.user.role !== 'ADMIN')
		throw new Error(errorMessage)
	return session
}
