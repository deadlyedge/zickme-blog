export interface ContentCheckResult {
	filePath: string
	slug?: string
	issues: string[]
	suggestions: string[]
	formattedFrontmatter?: string
}

export interface CheckConfig {
	dryRun: boolean
	autoFix: boolean
	showExamples: boolean
	postsDir: string
	galleryRoot?: string
	scope?: 'posts' | 'galleries' | 'all'
}
