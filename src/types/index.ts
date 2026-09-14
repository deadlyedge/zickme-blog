// Unified type exports

export type { Comment, CommentWithReplies } from './comments/comment'
export type { PublicCommentAuthor } from './comments/public-comment'
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
export type {
	Gallery,
	GalleryAlbumFrontmatter,
	GalleryExif,
	GalleryImage,
	GalleryImageFrontmatter,
	GalleryImageSyncStatus,
	GalleryIndexEntry,
	GalleryLayout,
	GalleryPublic,
	GalleryPublicImage,
	GallerySort,
	GalleryStatus,
} from './gallery'
export type {
	PublishResult,
	PublishScope,
	PublishStatus,
	PublishSummary,
	PublishTrigger,
} from './publish/publish'

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
