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

export const SNAPSHOT_SCHEMA_VERSION = 1

export type SnapshotTableRow = Record<string, unknown>

export type SnapshotPayload = {
	posts: SnapshotTableRow[]
	tags: SnapshotTableRow[]
	postTags: SnapshotTableRow[]
	galleries: SnapshotTableRow[]
	galleryImages: SnapshotTableRow[]
	siteProfile: SnapshotTableRow[]
	comments?: SnapshotTableRow[]
	galleryImageComments?: SnapshotTableRow[]
}

export type SnapshotSummary = {
	posts: number
	tags: number
	postTags: number
	galleries: number
	galleryImages: number
	siteProfile: number
	comments: number
	galleryImageComments: number
	includesComments: boolean
	totalRows: number
}

export type SnapshotSource = 'MANUAL' | 'PRE_RESTORE' | 'DEPLOYMENT'
export type SnapshotStatus =
	| 'CREATING'
	| 'READY'
	| 'RESTORING'
	| 'RESTORED'
	| 'FAILED'
	| 'DELETED'

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
