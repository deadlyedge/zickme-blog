import type { CollectionConfig } from 'payload'

export const Profile: CollectionConfig = {
	slug: 'profile',
	admin: {
		useAsTitle: 'name',
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
		},
		{
			name: 'title',
			type: 'text',
			required: true,
			admin: {
				description: '职位头衔',
			},
		},
		{
			name: 'bio',
			type: 'textarea',
			required: true,
		},
		{
			name: 'avatar',
			type: 'upload',
			relationTo: 'media',
		},
		{
			name: 'location',
			type: 'text',
		},
		{
			name: 'email',
			type: 'email',
		},
		{
			name: 'website',
			type: 'text',
		},
		{
			name: 'socialLinks',
			type: 'array',
			fields: [
				{
					name: 'platform',
					type: 'select',
					options: [
						'GitHub',
						'LinkedIn',
						'Twitter',
						'Instagram',
						'YouTube',
						'Other',
					],
					required: true,
				},
				{
					name: 'url',
					type: 'text',
					required: true,
				},
				{
					name: 'username',
					type: 'text',
				},
			],
		},
		{
			name: 'skills',
			type: 'array',
			fields: [
				{
					name: 'category',
					type: 'text',
					required: true,
				},
				{
					name: 'technologies',
					type: 'array',
					fields: [
						{
							name: 'name',
							type: 'text',
							required: true,
						},
						{
							name: 'level',
							type: 'select',
							options: [
								{ label: '入门', value: 'beginner' },
								{ label: '熟悉', value: 'intermediate' },
								{ label: '熟练', value: 'advanced' },
								{ label: '专家', value: 'expert' },
							],
						},
					],
				},
			],
		},
	],
}
