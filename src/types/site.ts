export type SocialLink = {
	platform:
		| 'GitHub'
		| 'LinkedIn'
		| 'Twitter'
		| 'Instagram'
		| 'YouTube'
		| 'Facebook'
		| 'Bilibili'
		| 'Zhihu'
		| 'Other'
	url: string
	username?: string
}

export type Technology = {
	id: string
	name: string
	level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export type Skill = {
	id?: string
	category: string
	technologies: Technology[]
}

export type Slogan = {
	id?: string
	text: string
	fontSize?: string
	color?: string
}

export interface ThemeVariables {
	background?: string
	foreground?: string
	card?: string
	cardForeground?: string
	popover?: string
	popoverForeground?: string
	primary?: string
	primaryForeground?: string
	secondary?: string
	secondaryForeground?: string
	muted?: string
	mutedForeground?: string
	accent?: string
	accentForeground?: string
	destructive?: string
	destructiveForeground?: string
	border?: string
	input?: string
	ring?: string
	radius?: string
	fontSans?: string
	fontSerif?: string
	fontMono?: string
	[key: string]: string | undefined
}

export interface ThemeConfig {
	preset?: 'default' | 'minimal-slate' | 'cyber-green' | 'warm-amber' | 'custom'
	customCss?: string
	light?: ThemeVariables
	dark?: ThemeVariables
}

export interface LandingPageConfig {
	enabled?: boolean
	showTopHottest?: boolean
	showSlogans?: boolean
	showPinnedPosts?: boolean
	showLatestPosts?: boolean
	pinnedPostIds?: string[]
}

export interface TimelineItem {
	id: string
	period: string
	role: string
	company: string
	companyUrl?: string
	location?: string
	description?: string
	achievements?: string[]
	technologies?: string[]
}

export interface FeaturedProject {
	id: string
	title: string
	description: string
	url?: string
	githubUrl?: string
	stars?: string
	tags?: string[]
}

export interface AboutPageConfig {
	headline?: string
	subheadline?: string
	statusText?: string
	careerTimeline?: TimelineItem[]
	educationTimeline?: TimelineItem[]
	featuredProjects?: FeaturedProject[]
}

export interface SiteProfile {
	id?: string
	name: string
	title: string
	bio: string
	location?: string | null
	email?: string | null
	website?: string | null
	avatar?: string | null
	socialLinks?: SocialLink[] | null
	skills?: Skill[] | null
	slogans?: Slogan[] | null
	themeConfig?: ThemeConfig | null
	landingPageConfig?: LandingPageConfig | null
	aboutPageConfig?: AboutPageConfig | null
	createdAt?: Date
	updatedAt?: Date
}
