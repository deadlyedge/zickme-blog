'use server'

import {
	type ActionResult,
	actionFailure,
	actionSuccess,
} from '@/lib/actions/action-result'
import { requireAdminSession } from '@/lib/auth/guards'
import { fetchDashboardStats } from '@/lib/dashboard/stats'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/dashboard')

/** 验证管理员权限后获取仪表盘统计数据。 */
export async function getDashboardStats(): Promise<
	ActionResult<Awaited<ReturnType<typeof fetchDashboardStats>>>
> {
	try {
		await requireAdminSession()
		return actionSuccess(await fetchDashboardStats())
	} catch (error) {
		logger.error('Get dashboard stats error', error)
		return actionFailure(
			error instanceof Error ? error.message : '获取仪表盘统计失败',
		)
	}
}
