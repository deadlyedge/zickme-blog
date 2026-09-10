// Unified type exports
import type { Comment } from './content'

export type {
	AboutPageConfig,
	ContentResponse,
	FeaturedProject,
	LandingPageConfig,
	Post,
	PostLink,
	PostLinkType,
	PostMetadata,
	PostWithTags,
	Role,
	SiteProfile,
	Skill,
	Slogan,
	SocialLink,
	StatusType,
	SyncLog,
	SyncLogItem,
	SyncResult,
	SyncStatus,
	Tag,
	Technology,
	ThemeConfig,
	ThemeVariables,
	TimelineItem,
	User,
} from './content'
export { isPostWithTags, isSiteProfile, isSocialLink } from './content'
export type { PublicCommentAuthor } from './public-user'

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
		displayName: string
		image: string | null
		banned: boolean
	}
}
