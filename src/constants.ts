// Validation constants for authentication
export const VALIDATION_RULES = {
	username: {
		minLength: 3,
		maxLength: 24,
	},
	password: {
		minLength: 6,
	},
	email: {
		pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	},
} as const

// Error messages
export const VALIDATION_MESSAGES = {
	username: {
		minLength: `用户名长度至少${VALIDATION_RULES.username.minLength}个字符`,
		maxLength: `用户名长度不能超过${VALIDATION_RULES.username.maxLength}个字符`,
	},
	password: {
		minLength: `密码长度至少${VALIDATION_RULES.password.minLength}位`,
	},
	email: {
		invalid: '请输入有效的邮箱地址',
	},
	confirmPassword: {
		required: '请确认密码',
		mismatch: '两次输入的密码不一致',
	},
	newPassword: {
		mismatch: '两次输入的新密码不一致',
	},
} as const
