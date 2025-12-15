// Unified type exports
import { Comment } from '@/generated/prisma/client'

export type {
	SiteProfile,
	ContentResponse,
	PostWithTags,
	SocialLink,
	Technology,
	Skill,
	Slogan,
	Tag,
	PostType,
	StatusType,
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

export { isSiteProfile, isPostWithTags, isSocialLink } from './content'

// User types
export type { UserWithRelations, AuthUser, SignInContext } from './user'

export { isAdmin, isEditor, canEditContent, isAuthUser } from './user'

// UI types
export type {
	BaseComponentProps,
	CardTiltProps,
	CardTiltContentProps,
	FormFieldProps,
	ModalProps,
	NavigationLinkProps,
	AnimatedContainerProps,
	SectionProps,
	ButtonVariant,
	ButtonSize,
	Theme,
	LoadingState,
	ErrorState,
} from './ui'

export { isValidButtonVariant, isValidButtonSize } from './ui'

// Re-export commonly used Prisma types for convenience
export type { Post, User, Comment, Role } from '@/generated/prisma/client'

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
