import { SiteProfile } from "./generated/prisma/client"

export type SocialLink = {
	platform:
		| 'GitHub'
		| 'LinkedIn'
		| 'Twitter'
		| 'Instagram'
		| 'YouTube'
		| 'Other'
	url: string
	username?: string
}

export type Technology = {
	name: string
	level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export type Skill = {
	category: string
	technologies: Technology[]
}

export type Slogan = {
	text: string
	fontSize?: string
	color?: string
}

export type SiteProfileExtended =
	| (Omit<SiteProfile, 'slogans' | 'skills' | 'socialLinks'> & {
			slogans: Slogan[] | null
			skills: Skill[] | null
			socialLinks: SocialLink[] | null
	  })
	| null

