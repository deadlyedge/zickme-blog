import type {
	FeaturedProject,
	PostWithTags,
	Skill,
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
	name: string
	title: string
	bio: string
	avatar: string
	location: string
	email: string
	website: string
	skills: Skill[]
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
	setName: (value: string) => void
	setTitle: (value: string) => void
	setBio: (value: string) => void
	setAvatar: (value: string) => void
	setLocation: (value: string) => void
	setEmail: (value: string) => void
	setWebsite: (value: string) => void
	updateSkill: (index: number, field: 'category', value: string) => void
	updateTechnology: (
		skillIndex: number,
		technologyIndex: number,
		field: 'name' | 'level',
		value: string,
	) => void
	addSkill: () => void
	removeSkill: (index: number) => void
	addTechnology: (skillIndex: number) => void
	removeTechnology: (skillIndex: number, technologyIndex: number) => void
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
