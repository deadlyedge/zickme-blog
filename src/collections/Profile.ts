import type { CollectionConfig } from 'payload'
import { convertToTailwindColor } from '../lib/utils'

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
		{
			name: 'slogans',
			type: 'array',
			admin: {
				description: '主页hero区域使用的标语文字',
			},
			fields: [
				{
					name: 'text',
					type: 'text',
					required: true,
					admin: {
						description: '标语文字内容',
					},
				},
				{
					name: 'fontSize',
					type: 'select',
					required: true,
					options: [
						{ label: '2xl', value: 'text-2xl' },
						{ label: '3xl', value: 'text-3xl' },
						{ label: '4xl', value: 'text-4xl' },
						{ label: '5xl', value: 'text-5xl' },
						{ label: '6xl', value: 'text-6xl' },
					],
					admin: {
						description: '字号大小',
					},
				},
				{
					name: 'color',
					type: 'text',
					admin: {
						description: '文字颜色，支持 hex (#333, #333333), hsl(h,s%,l%), rgb(r,g,b)。留空使用默认颜色',
					},
					hooks: {
						beforeValidate: [
							({ value }) => {
								return convertToTailwindColor(value)
							},
						],
					},
				},
			],
		},
	],
}
