import type {
	FeaturedProject,
	PostWithTags,
	Slogan,
	SocialLink,
	ThemeConfig,
	TimelineItem,
} from '@/types'

export type EditableSocialLink = SocialLink & { id: string }

export interface SettingsTabsProps {
	themePreset: ThemeConfig['preset']
	customCss: string
	landingEnabled: boolean
	showTopHottest: boolean
	showSlogans: boolean
	showPinnedPosts: boolean
	showLatestPosts: boolean
	pinnedPostIds: string[]
	slogans: Slogan[]
	socialLinks: EditableSocialLink[]
	aboutHeadline: string
	aboutSubheadline: string
	aboutStatusText: string
	careerTimeline: TimelineItem[]
	featuredProjects: FeaturedProject[]
	allPosts: PostWithTags[]
	setCustomCss: (value: string) => void
	setLandingEnabled: (value: boolean) => void
	setShowTopHottest: (value: boolean) => void
	setShowSlogans: (value: boolean) => void
	setShowPinnedPosts: (value: boolean) => void
	setShowLatestPosts: (value: boolean) => void
	setAboutHeadline: (value: string) => void
	setAboutSubheadline: (value: string) => void
	setAboutStatusText: (value: string) => void
	setCareerTimeline: (value: TimelineItem[]) => void
	setFeaturedProjects: (value: FeaturedProject[]) => void
	handleApplyPreset: (presetKey: string) => void
	togglePinnedPost: (postId: string) => void
	updateSlogan: (index: number, field: keyof Slogan, value: string) => void
	addSlogan: () => void
	removeSlogan: (index: number) => void
	updateSocialLink: (id: string, field: keyof SocialLink, value: string) => void
	addSocialLink: () => void
	removeSocialLink: (id: string) => void
	addCareerItem: () => void
	addFeaturedProject: () => void
}
