// Unified type exports. Prefer importing from the domain module in new code.
export type {
	Comment,
	CommentWithReplies,
	PublicCommentAuthor,
} from './comment'
export type { HomePageData } from './content/home'
export type { PostLink, PostLinkType, PostMetadata } from './content/metadata'
export type { Post, PostWithTags, StatusType } from './content/post'
export { isPostWithTags } from './content/post'
export type { Tag } from './content/tag'
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
} from './gallery/index'
export type {
	PublishResult,
	PublishScope,
	PublishStatus,
	PublishSummary,
	PublishTrigger,
} from './publish/publish'
export type {
	AboutPageConfig,
	FeaturedProject,
	LandingPageConfig,
	SiteProfile,
	Skill,
	Slogan,
	SocialLink,
	Technology,
	ThemeConfig,
	ThemeVariables,
	TimelineItem,
} from './site'
export type { Role, SyncLogItem, SyncResult, SyncStatus } from './sync'
