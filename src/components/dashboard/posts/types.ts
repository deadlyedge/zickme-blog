import type { PostWithTags, StatusType } from '@/types/content/post'

export type PostListProps = {
	posts: PostWithTags[]
	selectedIds: string[]
	isPending: boolean
	onToggleSelect: (postId: string) => void
	onPreview: (post: PostWithTags) => void
	onEditPoster: (post: PostWithTags) => void
	onStatusChange: (postId: string, status: StatusType) => void
	onArchive: (postId: string) => void
	onRestore: (postId: string) => void
	onDelete: (post: PostWithTags) => void
}
