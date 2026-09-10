import type { z } from 'zod'

/**
 * 统一的 Server Action 成功/失败响应结构
 */
export type ActionResponse<T = void> =
	| { success: true; data: T; error?: never }
	| { success: false; error: string; code?: string; data?: never }

/**
 * 格式化 Zod 校验错误信息为简洁字符串
 */
export function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => issue.message).join('; ') || '参数验证失败'
}
