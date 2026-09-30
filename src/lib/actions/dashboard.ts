'use server'

import { requireAdminSession } from '@/lib/auth/guards'
import { fetchDashboardStats } from '@/lib/dashboard/stats'
import { createLogger } from '@/lib/logger'

const logger = createLogger('actions/dashboard')

/** 验证管理员权限后获取仪表盘统计数据。 */
export async function getDashboardStats() {
	try {
		await requireAdminSession()
		return await fetchDashboardStats()
	} catch (error) {
		logger.error('Get dashboard stats error', error)
		throw error
	}
}
