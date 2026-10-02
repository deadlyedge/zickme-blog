import type { SiteProfile } from '@/types/site'
import type { SiteFiles } from './site-schema'

type SiteProfileExportSource = Pick<
	SiteProfile,
	| 'name'
	| 'title'
	| 'bio'
	| 'location'
	| 'email'
	| 'website'
	| 'socialLinks'
	| 'skills'
	| 'slogans'
	| 'themeConfig'
	| 'landingPageConfig'
	| 'aboutPageConfig'
> & { avatar?: string | null }

export function toSiteFilesForExport(
	profile: SiteProfileExportSource,
	postSlugById: ReadonlyMap<string, string>,
): { files: SiteFiles; hasLegacyAvatar: boolean; unmappedPinnedIds: string[] } {
	const landingConfig = profile.landingPageConfig
	const pinnedIds = landingConfig?.pinnedPostIds ?? []
	const pinnedPostSlugs = pinnedIds.flatMap((id) => {
		const slug = postSlugById.get(id)
		return slug ? [slug] : []
	})
	const unmappedPinnedIds = pinnedIds.filter((id) => !postSlugById.has(id))
	return {
		files: {
			profile: {
				name: profile.name,
				title: profile.title,
				bio: profile.bio,
				...(profile.avatar ? { portraitImage: 'portrait.webp' as const } : {}),
				...(profile.location ? { location: profile.location } : {}),
				...(profile.email ? { email: profile.email } : {}),
				...(profile.website ? { website: profile.website } : {}),
				socialLinks:
					profile.socialLinks?.map((link) => ({
						platform: link.platform,
						url: link.url,
						...(link.username ? { username: link.username } : {}),
					})) ?? null,
				skills:
					profile.skills?.map((skill) => ({
						category: skill.category,
						technologies: skill.technologies.map((technology) => ({
							name: technology.name,
							...(technology.level ? { level: technology.level } : {}),
						})),
					})) ?? null,
				about: profile.aboutPageConfig ?? null,
			},
			theme: profile.themeConfig ?? null,
			landing:
				landingConfig || profile.slogans
					? {
							...(landingConfig
								? {
										enabled: landingConfig.enabled,
										showTopHottest: landingConfig.showTopHottest,
										showSlogans: landingConfig.showSlogans,
										showPinnedPosts: landingConfig.showPinnedPosts,
										showLatestPosts: landingConfig.showLatestPosts,
									}
								: {}),
							slogans:
								profile.slogans?.map((slogan) => ({
									text: slogan.text,
									...(slogan.fontSize ? { fontSize: slogan.fontSize } : {}),
									...(slogan.color ? { color: slogan.color } : {}),
								})) ?? null,
							...(pinnedPostSlugs.length > 0 ? { pinnedPostSlugs } : {}),
						}
					: null,
		},
		hasLegacyAvatar: Boolean(profile.avatar),
		unmappedPinnedIds,
	}
}
