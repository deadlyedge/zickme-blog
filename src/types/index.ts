// Unified type exports
import type { Comment } from '@/generated/prisma/client'

export type {
	ContentResponse,
	PostType,
	PostWithTags,
	SiteProfile,
	Skill,
	Slogan,
	SocialLink,
	StatusType,
	Tag,
	Technology,
} from './content'

// Content types
// export type {
// 	SiteProfile,
// 	ContentResponse,
// 	PostWithTags,
// 	SocialLink,
// 	Technology,
// 	Skill,
// 	Slogan,
// 	Tag,
// }

// export type { PostType, StatusType }

// Re-export commonly used Prisma types for convenience
export type { Comment, Post, Role, User } from '@/generated/prisma/client'
export { isPostWithTags, isSiteProfile, isSocialLink } from './content'
// UI types
export type {
	AnimatedContainerProps,
	BaseComponentProps,
	ButtonSize,
	ButtonVariant,
	CardTiltContentProps,
	CardTiltProps,
	ErrorState,
	FormFieldProps,
	LoadingState,
	ModalProps,
	NavigationLinkProps,
	SectionProps,
	Theme,
} from './ui'
export { isValidButtonSize, isValidButtonVariant } from './ui'
// User types
export type { AuthUser, SignInContext, UserWithRelations } from './user'
export { canEditContent, isAdmin, isAuthUser, isEditor } from './user'

// comment type
export interface CommentWithReplies extends Comment {
	replies?: CommentWithReplies[]
	depth?: number
	author: {
		id: string
		name: string
		email: string
		image: string | null
		banned: boolean
	}
}
