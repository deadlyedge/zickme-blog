import type { CollectionConfig } from 'payload'
import { generateSlug } from '../lib/slug'

export const Tags: CollectionConfig = {
	slug: 'tags',
	admin: {
		useAsTitle: 'name',
	},
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			admin: {
				description: '标签名称',
			},
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
						if (data?.name && !data.slug) {
							return generateSlug(data.name)
						}
						return data?.slug
					},
				],
			},
		},
		{
			name: 'color',
			type: 'text',
			admin: {
				description: '标签颜色 (可选)',
			},
		},
	],
}
