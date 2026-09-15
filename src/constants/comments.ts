export const COMMENT_RULES = {
	content: {
		minLength: 1,
		maxLength: 2000,
	},
	idMaxLength: 128,
	pathMaxLength: 512,
} as const

export const COMMENT_MESSAGES = {
	contentRequired: '评论内容不能为空',
	contentTooLong: '评论内容不能超过2000字',
	idRequired: '评论ID不能为空',
	documentIdRequired: '文章ID不能为空',
	pathRequired: '页面路径不能为空',
} as const
