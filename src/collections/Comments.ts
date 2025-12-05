import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/lib/access'

export const Comments: CollectionConfig = {
	slug: 'comments',
	admin: {
		useAsTitle: 'content',
		defaultColumns: ['content', 'status', 'createdAt'],
	},
	access: {
		read: () => true,
		create: (req) => !!req.id, // Allow public creation for now (guests)
		update: ({ req }) => {
			// 1. 管理员拥有全部权限
			if (isAdmin(req.user)) return true

			// 2. 未登录用户无权修改
			if (!req.user) return false

			// 3. 返回一个查询条件：只允许修改 author.user 等于当前用户ID 的文档
			return {
				'author.user': {
					equals: req.user.id,
				},
			}
		},
		delete: ({ req }) => isAdmin(req.user),
	},
	// hooks: {
	// 	beforeChange: [
	// 		({ req, operation, data, originalDoc }) => {
	// 			if (operation === 'update' && !isAdmin(req.user)) {
	// 				// Check if user is the author for updates
	// 				if (req.user?.id && originalDoc?.author?.user?.id !== req.user.id) {
	// 					throw new Error('You can only update your own comments')
	// 				}

	// 				// Only allow updating content field for regular users
	// 				const allowedFields = ['content']
	// 				const updatedFields = Object.keys(data || {})

	// 				for (const field of updatedFields) {
	// 					if (!allowedFields.includes(field)) {
	// 						throw new Error(
	// 							`You can only update the following fields: ${allowedFields.join(', ')}`,
	// 						)
	// 					}
	// 				}
	// 			}

	// 			return data
	// 		},
	// 	],
	// },
	fields: [
		{
			name: 'content',
			type: 'textarea',
			required: true,
			admin: {
				description: 'Comment content',
			},
			access: {},
		},
		{
			name: 'doc',
			type: 'relationship',
			relationTo: ['posts', 'projects'],
			required: true,
			hasMany: false,
			admin: {
				description: 'The post or project this comment belongs to',
			},
			access: {
				update: ({ req }) => isAdmin(req.user),
			},
		},
		{
			name: 'parent',
			type: 'relationship',
			relationTo: 'comments',
			hasMany: false,
			filterOptions: ({ data }) => {
				// Only apply filter when we have document context
				if (data?.doc) {
					return {
						'doc.relationTo': {
							equals: data.doc.relationTo,
						},
						'doc.value': {
							equals: data.doc.value,
						},
					}
				}
				return true
			},
			admin: {
				description: 'Parent comment for threaded replies',
			},
			access: {
				update: ({ req }) => isAdmin(req.user),
			},
		},
		{
			name: 'author',
			type: 'group',
			label: 'Author Info',
			admin: {
				position: 'sidebar',
				readOnly: true,
			},
			fields: [
				{
					name: 'user',
					type: 'relationship',
					relationTo: 'users',
					hasMany: false,
					admin: {
						description: 'Linked registered user (optional)',
					},
				},
				{
					name: 'name',
					type: 'text',
					admin: {
						description: 'Guest name (if not logged in)',
					},
				},
				{
					name: 'email',
					type: 'email',
					access: {
						read: ({ req, doc, siblingData }) => {
							// 1. 管理员总是可以查看
							if (isAdmin(req.user)) return true

							// 2. 获取这是谁写的评论
							// email 字段在 author group 中，siblingData 即为 author 对象
							// 或者使用 doc.author.user
							const authorUser = doc?.author?.user || siblingData?.user

							// 3. 处理 user 可能是 ID 字符串或对象的情况
							const authorId =
								typeof authorUser === 'object' ? authorUser?.id : authorUser

							// 4. 判断作者是否为当前用户
							return authorId === req.user?.id
						},
					},
					admin: {
						description: 'Guest email (private, for notifications/gravatar)',
					},
				},
			],
		},
		{
			name: 'status',
			type: 'select',
			admin: {
				position: 'sidebar',
			},
			options: [
				{ label: 'Published', value: 'published' },
				{ label: 'Pending', value: 'pending' },
				{ label: 'Spam', value: 'spam' },
			],
			defaultValue: 'published',
			required: true,
			access: {
				update: ({ req }) => isAdmin(req.user),
			},
		},
	],
}
