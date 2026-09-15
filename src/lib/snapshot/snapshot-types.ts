import type {
	comments,
	galleries,
	galleryImageComments,
	galleryImages,
	posts,
	postsToTags,
	siteProfile,
	tags,
} from '@/db/schema'

export type SnapshotSourceTables = {
	posts: typeof posts
	tags: typeof tags
	postTags: typeof postsToTags
	galleries: typeof galleries
	galleryImages: typeof galleryImages
	siteProfile: typeof siteProfile
	comments: typeof comments
	galleryImageComments: typeof galleryImageComments
}
