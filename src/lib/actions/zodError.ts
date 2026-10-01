import type { z } from 'zod'

/**
 * 格式化 Zod 校验错误信息为简洁字符串
 */
export function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => issue.message).join('; ') || '参数验证失败'
}
