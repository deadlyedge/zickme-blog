import { isAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'
import { VALIDATION_MESSAGES, VALIDATION_RULES } from '@/constants'

export const Users: CollectionConfig = {
	slug: 'users',
	admin: {
		useAsTitle: 'email',
	},
	auth: {
		tokenExpiration: 7200, // How many seconds to keep the user logged in
		// verify: true, // Require email verification before being allowed to authenticate
		maxLoginAttempts: 5, // Automatically lock a user out after X amount of failed logins
		lockTime: 600 * 1000, // Time period to allow the max login attempts
		// More options are available
	},
	access: {
		read: () => true,
		create: () => true,
		update: ({ req, id }) => req.user?.id === id || isAdmin(req.user),
		delete: ({ req }) => isAdmin(req.user),
	},
	fields: [
		// Email added by default, admin only can modify
		{
			name: 'email',
			type: 'text',
			required: true,
			unique: true,
			access: {
				read: ({ req, id }) => req.user?.id === id || isAdmin(req.user),
				update: ({ req }) => isAdmin(req.user),
			},
		},
		{
			name: 'username',
			type: 'text',
			required: true,
			unique: true,
			validate: (value: string | string[] | null | undefined) => {
				if (!value || typeof value !== 'string') return true // Let required handle this
				if (value.length < VALIDATION_RULES.username.minLength) {
					return VALIDATION_MESSAGES.username.minLength
				}
				if (value.length > VALIDATION_RULES.username.maxLength) {
					return VALIDATION_MESSAGES.username.maxLength
				}
				return true
			},
			access: {
				update: ({ req, doc }) => {
					// Users can update their own username, admins can update any
					return req.user && doc && req.user.id && doc.id
						? req.user.id === doc.id || isAdmin(req.user)
						: false
				},
			},
		},
		{
			admin: {
				position: 'sidebar',
			},
			name: 'roles',
			type: 'select',
			hasMany: true,
			defaultValue: ['user'],
			options: [
				{ label: 'Admin', value: 'admin' },
				{ label: 'User', value: 'user' },
			],
			access: {
				create: ({ req }) => isAdmin(req.user),
				update: ({ req }) => isAdmin(req.user),
			},
		},
		{
			name: 'banned',
			type: 'checkbox',
			defaultValue: false,
			admin: {
				position: 'sidebar',
				description: '用户是否被封禁',
			},
			access: {
				// read: ({ req }) => !isAdmin(req.user), // 只允许管理员查看
				update: ({ req }) => isAdmin(req.user), // 允许程序或管理员修改
			},
		},
		// 用户最近登录时间
		{
			name: 'lastLoginAt',
			type: 'date',
			admin: {
				position: 'sidebar',
				description: '用户最近登录时间',
			},
			access: {
				// 所有人可以查看，程序自动更新
				read: () => true,
				update: () => false, // 只允许程序自动更新
			},
		},
		// 用户评论数量
		{
			name: 'commentsCount',
			type: 'number',
			defaultValue: 0,
			admin: {
				position: 'sidebar',
				description: '用户评论数量',
			},
			access: {
				// 所有人可以查看，只允许程序更新
				read: () => true,
				update: () => false, // 只允许程序更新
			},
		},
		// 用户资料信息
		{
			name: 'profile',
			type: 'group',
			admin: {
				description: '用户个人资料',
			},
			access: {
				// 用户可以更新自己的资料，管理员可以更新任何用户的资料
				// create: ({ req, id }) => req.user?.id === id || isAdmin(req.user),
				// update: ({ req, id }) => req.user?.id === id || isAdmin(req.user),
			},
			fields: [
				{
					name: 'nickname',
					type: 'text',
					admin: {
						description: '用户昵称',
					},
				},
				{
					name: 'avatar',
					type: 'upload',
					relationTo: 'media',
					admin: {
						description: '用户头像',
					},
				},
				{
					name: 'bio',
					type: 'textarea',
					admin: {
						description: '个人简介',
					},
				},
				{
					name: 'location',
					type: 'text',
					admin: {
						description: '所在地',
					},
				},
				{
					name: 'website',
					type: 'text',
					admin: {
						description: '个人网站',
					},
				},
				{
					name: 'github',
					type: 'text',
					admin: {
						description: 'GitHub用户名',
					},
				},
				{
					name: 'twitter',
					type: 'text',
					admin: {
						description: 'Twitter用户名',
					},
				},
			],
		},
	],
}
