import type { CollectionConfig } from 'payload'
import { generateSlug } from '../lib/utils'

export const Projects: CollectionConfig = {
	slug: 'projects',
	admin: {
		useAsTitle: 'title',
	},
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
		},
		{
			name: 'slug',
			type: 'text',
			required: true,
			admin: {
				description: 'URL友好的标识符',
				position: 'sidebar',
			},
			hooks: {
				beforeValidate: [
					({ data }) => {
						if (data?.title && !data.slug) {
							return generateSlug(data.title)
						}
						return data?.slug
					},
				],
			},
		},
		{
			name: 'description',
			type: 'textarea',
			required: true,
		},
		{
			name: 'longDescription',
			type: 'richText',
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
					name: 'url',
					type: 'text',
				},
			],
		},
		{
			name: 'images',
			type: 'array',
			fields: [
				{
					name: 'image',
					type: 'upload',
					relationTo: 'media',
					required: true,
				},
				{
					name: 'caption',
					type: 'text',
				},
			],
		},
		{
			name: 'demoUrl',
			type: 'text',
			admin: {
				description: '演示地址',
			},
		},
		{
			name: 'sourceUrl',
			type: 'text',
			admin: {
				description: '源码地址',
			},
		},
		{
			name: 'featured',
			type: 'checkbox',
			defaultValue: false,
			admin: {
				description: '设为精选项目',
			},
		},
		{
			name: 'startDate',
			type: 'date',
		},
		{
			name: 'endDate',
			type: 'date',
		},
	],
}
