export interface DashboardStats {
	overview: {
		totalUsers: number
		totalComments: number
		totalPosts: number
		publishedPosts: number
		draftPosts: number
		totalTags: number
	}
	topCommentedPosts: Array<{
		id: string
		title: string
		slug: string
		commentCount: number
	}>
	topCommentingUsers: Array<{
		id: string
		name: string
		email: string
		commentCount: number
	}>
	recentComments: Array<{
		id: string
		content: string
		authorName: string
		postTitle: string
		postSlug: string
		createdAt: Date
	}>
}
