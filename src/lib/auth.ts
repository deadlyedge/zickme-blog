import { User } from './store/types'

// API 基础配置
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/users'

// 通用API调用函数
async function apiCall<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`, {
		credentials: 'include', // 包含 cookie
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		...options,
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({
			message: `HTTP ${response.status}: ${response.statusText}`,
		}))
		throw new Error(error.message || '请求失败')
	}

	return response.json()
}

// 认证相关API调用
export const authApi = {
	// 登录
	async login(
		email: string,
		password: string,
	): Promise<{ user: User; token?: string }> {
		return apiCall('/login', {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		})
	},

	// 注册
	async register(
		username: string,
		email: string,
		password: string,
	): Promise<{ user: User; token?: string }> {
		return apiCall('/', {
			method: 'POST',
			body: JSON.stringify({ username, email, password }),
		})
	},

	// 登出
	async logout(): Promise<void> {
		return apiCall('/logout', {
			method: 'POST',
		})
	},

	// 修改密码
	async changePassword(
		oldPassword: string,
		newPassword: string,
	): Promise<void> {
		return apiCall('/change-password', {
			method: 'POST',
			body: JSON.stringify({ oldPassword, newPassword }),
		})
	},

	// 更新账户信息
	async updateProfile(
		username: string,
		currentPassword?: string,
		newPassword?: string,
	): Promise<User> {
		const { user } = await this.getCurrentUser()

		if (!user) {
			throw new Error('用户未登录')
		}

		if (currentPassword) {
			try {
				await this.login(user.email, currentPassword)
			} catch {
				throw new Error('旧密码错误')
			}
		}

		return apiCall(`/${user.id}`, {
			method: 'PATCH',
			body: JSON.stringify({
				username,
				// currentPassword,
				password: newPassword,
			}),
		})
	},

	// 获取当前用户信息
	async getCurrentUser(): Promise<{ user: User } & Record<string, unknown>> {
		return apiCall('/me', {
			cache: 'no-store', // 确保每次请求都命中服务器，验证 HTTP-only cookie
		})
	},
}

// 认证状态管理
export class AuthManager {
	private static instance: AuthManager
	private currentUser: User | null = null
	private listeners: ((user: User | null) => void)[] = []

	private constructor() {}

	static getInstance(): AuthManager {
		if (!AuthManager.instance) {
			AuthManager.instance = new AuthManager()
		}
		return AuthManager.instance
	}

	// 检查认证状态
	async checkAuth(): Promise<User | null> {
		try {
			const response = await authApi.getCurrentUser()
			const user = response.user
			this.setUser(user)
			return user
		} catch {
			this.setUser(null)
			return null
		}
	}

	// 设置用户状态并通知监听器
	private setUser(user: User | null) {
		this.currentUser = user
		this.listeners.forEach((listener) => listener(user))
	}

	// 获取当前用户
	getCurrentUser(): User | null {
		return this.currentUser
	}

	// 添加认证状态监听器
	addAuthListener(listener: (user: User | null) => void) {
		this.listeners.push(listener)
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener)
		}
	}

	// 清除监听器
	clearListeners() {
		this.listeners = []
	}
}

// 导出单例实例
export const authManager = AuthManager.getInstance()

// 客户端认证工具函数
export const authUtils = {
	// 检查是否是有效邮箱
	isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	},

	// 检查密码强度
	isValidPassword(password: string): boolean {
		return password.length >= 6
	},

	// 检查用户名格式
	isValidUsername(username: string): boolean {
		return username.length >= 3 && username.length <= 20
	},

	// 获取用户显示名称
	getUserDisplayName(user: User): string {
		return user.username || user.email || '用户'
	},

	// 检查是否已登录
	isLoggedIn(): boolean {
		return !!authManager.getCurrentUser()
	},
}
