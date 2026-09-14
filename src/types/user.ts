import type { InferSelectModel } from 'drizzle-orm'
import type { users } from '@/db/schema'
import type { Comment } from './comment'
import type { Role } from './sync'

export type User = InferSelectModel<typeof users>

// Extended user types
export interface UserWithRelations extends User {
	comments?: Comment[]
}

// Auth-related types
export interface AuthUser {
	id: string
	name: string
	email: string
	image?: string | null
	role: Role
}

export interface SignInContext {
	user: AuthUser
	account: unknown
	profile?: unknown
}

// User role utilities
export function isAdmin(user: AuthUser | null): boolean {
	return user?.role === 'ADMIN'
}

export function isEditor(user: AuthUser | null): boolean {
	return user?.role === 'EDITOR' || user?.role === 'ADMIN'
}

export function canEditContent(user: AuthUser | null): boolean {
	return isEditor(user) || isAdmin(user)
}

// Type guards
export function isAuthUser(user: unknown): user is AuthUser {
	return (
		user !== null &&
		typeof user === 'object' &&
		'id' in user &&
		typeof (user as Record<string, unknown>).id === 'string' &&
		'email' in user &&
		typeof (user as Record<string, unknown>).email === 'string' &&
		'role' in user
	)
}
