export const CONTENT_QUERY_LIMITS = {
	posts: {
		default: 100,
		max: 200,
	},
	hottestPosts: {
		default: 5,
		max: 20,
	},
	searchPosts: {
		default: 200,
		max: 200,
	},
} as const

export const CONTENT_RULES = {
	idMaxLength: 128,
	slugMaxLength: 200,
} as const
