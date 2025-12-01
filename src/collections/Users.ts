import { isAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
	slug: 'users',
	admin: {
		useAsTitle: 'email',
	},
	auth: true,
	fields: [
		// Email added by default
		// Add more fields as needed
		{
			name: 'username',
			type: 'text',
			required: true,
			unique: true,
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
				update: ({ req }) => isAdmin(req.user),
			},
		},
	],
}
