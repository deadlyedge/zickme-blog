import type { SiteProfile } from '../site'
import type { PostWithTags } from './post'

export interface HomePageData {
	profile: SiteProfile | null
	latestPosts: PostWithTags[]
	hottestPosts?: PostWithTags[]
	pinnedPosts?: PostWithTags[]
}
