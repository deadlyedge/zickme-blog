export const PROFILE_RULES = {
	name: { minLength: 1, maxLength: 100 },
	title: { maxLength: 150 },
	bio: { maxLength: 2000 },
	location: { maxLength: 100 },
	username: { minLength: 3, maxLength: 24 },
} as const
