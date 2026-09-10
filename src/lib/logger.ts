type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
	[key: string]: unknown
}

const isProduction = process.env.NODE_ENV === 'production'

/**
 * 敏感字段列表，用于日志脱敏
 */
const SENSITIVE_KEYS = new Set([
	'password',
	'currentpassword',
	'newpassword',
	'token',
	'session',
	'secret',
	'authorization',
	'cookie',
	'database_url',
	'api_key',
])

/**
 * 敏感数据脱敏处理
 */
function sanitizeData(data: unknown): unknown {
	if (data === null || data === undefined) return data
	if (typeof data === 'string') {
		// 截断过长字符串（如 Base64、文件内容）
		if (data.length > 500) {
			return `${data.slice(0, 100)}... [truncated, length: ${data.length}]`
		}
		return data
	}
	if (typeof data === 'number' || typeof data === 'boolean') {
		return data
	}
	if (data instanceof Error) {
		return {
			name: data.name,
			message: data.message,
			stack: isProduction ? undefined : data.stack,
		}
	}
	if (Array.isArray(data)) {
		return data.map((item) => sanitizeData(item))
	}
	if (typeof data === 'object') {
		const result: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(
			data as Record<string, unknown>,
		)) {
			if (SENSITIVE_KEYS.has(key.toLowerCase())) {
				result[key] = '***[REDACTED]***'
			} else {
				result[key] = sanitizeData(value)
			}
		}
		return result
	}
	return String(data)
}

function formatMessage(
	level: LogLevel,
	module: string,
	message: string,
	context?: LogContext,
) {
	const timestamp = new Date().toISOString()
	const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`

	if (isProduction) {
		const logObject = {
			timestamp,
			level,
			module,
			message,
			...(context ? { context: sanitizeData(context) } : {}),
		}
		return JSON.stringify(logObject)
	}

	return {
		prefix,
		message,
		context: context ? sanitizeData(context) : undefined,
	}
}

export class Logger {
	constructor(private module: string) {}

	debug(message: string, context?: LogContext) {
		if (isProduction) return
		const formatted = formatMessage('debug', this.module, message, context)
		if (typeof formatted === 'string') {
			console.debug(formatted)
		} else {
			if (formatted.context) {
				console.debug(
					`${formatted.prefix} ${formatted.message}`,
					formatted.context,
				)
			} else {
				console.debug(`${formatted.prefix} ${formatted.message}`)
			}
		}
	}

	info(message: string, context?: LogContext) {
		const formatted = formatMessage('info', this.module, message, context)
		if (typeof formatted === 'string') {
			console.info(formatted)
		} else {
			if (formatted.context) {
				console.info(
					`${formatted.prefix} ${formatted.message}`,
					formatted.context,
				)
			} else {
				console.info(`${formatted.prefix} ${formatted.message}`)
			}
		}
	}

	warn(message: string, context?: LogContext) {
		const formatted = formatMessage('warn', this.module, message, context)
		if (typeof formatted === 'string') {
			console.warn(formatted)
		} else {
			if (formatted.context) {
				console.warn(
					`${formatted.prefix} ${formatted.message}`,
					formatted.context,
				)
			} else {
				console.warn(`${formatted.prefix} ${formatted.message}`)
			}
		}
	}

	error(message: string, error?: unknown, context?: LogContext) {
		const mergedContext: LogContext = {
			...context,
			...(error !== undefined ? { error: sanitizeData(error) } : {}),
		}
		const formatted = formatMessage(
			'error',
			this.module,
			message,
			mergedContext,
		)
		if (typeof formatted === 'string') {
			console.error(formatted)
		} else {
			if (formatted.context) {
				console.error(
					`${formatted.prefix} ${formatted.message}`,
					formatted.context,
				)
			} else {
				console.error(`${formatted.prefix} ${formatted.message}`)
			}
		}
	}
}

/**
 * 创建针对特定模块的 Logger 实例
 */
export function createLogger(module: string): Logger {
	return new Logger(module)
}
