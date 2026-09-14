export type PostLinkType =
	| 'github'
	| 'twitter'
	| 'demo'
	| 'documentation'
	| 'figma'
	| 'paper'
	| 'website'
	| 'other'

export interface PostLink {
	url: string
	label?: string
	type: PostLinkType
}

export interface PostMetadata {
	links: PostLink[]
	category?: string
	series?: string
	canonicalUrl?: string
	outdatedWarning?: string
	layout?: 'article' | 'gallery' | 'photo'
}
