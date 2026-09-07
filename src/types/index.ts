// Unified type exports
import type { Comment } from './content'

export type {
	ContentResponse,
	Post,
	PostWithTags,
	Role,
	SiteProfile,
	Skill,
	Slogan,
	SocialLink,
	StatusType,
	Tag,
	Technology,
	User,
} from './content'

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

// Comment type
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
