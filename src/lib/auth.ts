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
