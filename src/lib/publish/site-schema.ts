import { z } from 'zod'
import { PROFILE_RULES } from '@/constants/profile'
import type {
	AboutPageConfig,
	SiteLandingFileConfig,
	Skill,
	Slogan,
	SocialLink,
	ThemeConfig,
	ThemeVariables,
} from '@/types/site'

export const SITE_PORTRAIT_MAX_BYTES = 5 * 1024 * 1024
export const SITE_PORTRAIT_MAX_DIMENSION = 4096
export const SITE_FILE_NAMES = [
	'profile.yaml',
	'social.yaml',
	'skills.yaml',
	'slogans.yaml',
	'theme.yaml',
	'landing.yaml',
	'about.yaml',
] as const

const optionalText = (maxLength: number) =>
	z.preprocess(
		(value) => (value === '' || value === null ? undefined : value),
		z.string().trim().max(maxLength).optional(),
	)

const httpUrl = z.httpUrl()

const socialLinkSchema = z
	.object({
		platform: z.enum([
			'GitHub',
			'LinkedIn',
			'Twitter',
			'Instagram',
			'YouTube',
			'Facebook',
			'Bilibili',
			'Zhihu',
			'Other',
		]),
		url: httpUrl,
		username: optionalText(100),
	})
	.strict()

const technologySchema = z
	.object({
		name: z.string().trim().min(1).max(100),
		level: z
			.enum(['beginner', 'intermediate', 'advanced', 'expert'])
			.optional(),
	})
	.strict()

const skillSchema = z
	.object({
		category: z.string().trim().min(1).max(100),
		technologies: z.array(technologySchema).max(100),
	})
	.strict()

const sloganSchema = z
	.object({
		text: z.string().trim().min(1).max(500),
		fontSize: optionalText(100),
		color: optionalText(100),
	})
	.strict()

const timelineItemSchema = z
	.object({
		id: optionalText(100),
		period: z.string().trim().min(1).max(100),
		role: z.string().trim().min(1).max(200),
		company: z.string().trim().min(1).max(200),
		companyUrl: httpUrl.optional(),
		location: optionalText(200),
		description: optionalText(5000),
		achievements: z.array(z.string().max(1000)).max(50).optional(),
		technologies: z.array(z.string().max(100)).max(100).optional(),
	})
	.strict()

const featuredProjectSchema = z
	.object({
		id: optionalText(100),
		title: z.string().trim().min(1).max(200),
		description: z.string().max(5000),
		url: httpUrl.optional(),
		githubUrl: httpUrl.optional(),
		stars: optionalText(100),
		tags: z.array(z.string().max(100)).max(100).optional(),
	})
	.strict()

const aboutPageConfigSchema = z
	.object({
		headline: optionalText(300),
		subheadline: optionalText(2000),
		statusText: optionalText(300),
		careerTimeline: z.array(timelineItemSchema).max(100).optional(),
		educationTimeline: z.array(timelineItemSchema).max(100).optional(),
		featuredProjects: z.array(featuredProjectSchema).max(100).optional(),
	})
	.strict()

const themeVariableKeys = [
	'background',
	'foreground',
	'card',
	'cardForeground',
	'popover',
	'popoverForeground',
	'primary',
	'primaryForeground',
	'secondary',
	'secondaryForeground',
	'muted',
	'mutedForeground',
	'accent',
	'accentForeground',
	'destructive',
	'destructiveForeground',
	'border',
	'input',
	'ring',
	'radius',
	'fontSans',
	'fontSerif',
	'fontMono',
] as const

const cssVariableKeys = themeVariableKeys.flatMap((key) => [
	key,
	`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
])

const themeModeSchema = z.custom<ThemeVariables | null | undefined>((value) => {
	if (value === null || value === undefined) return true
	if (typeof value !== 'object' || Array.isArray(value)) return false
	return Object.entries(value).every(
		([key, cssValue]) =>
			cssVariableKeys.includes(key) &&
			typeof cssValue === 'string' &&
			cssValue.length <= 5000 &&
			!/[<>]/.test(cssValue),
	)
}, '主题变量名称或值无效')

const themeConfigSchema = z
	.object({
		preset: z
			.enum(['default', 'minimal-slate', 'cyber-green', 'warm-amber', 'custom'])
			.optional(),
		customCss: z
			.string()
			.max(20000)
			.refine((value) => !/[<>]/.test(value), 'customCss 不能包含 < 或 >')
			.optional(),
		light: themeModeSchema.nullable().optional(),
		dark: themeModeSchema.nullable().optional(),
	})
	.strict()
	.transform(
		(value) =>
			({
				...value,
				light: value.light ?? undefined,
				dark: value.dark ?? undefined,
			}) as ThemeConfig,
	)

export const siteProfileFileSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(PROFILE_RULES.name.minLength)
			.max(PROFILE_RULES.name.maxLength),
		title: z.string().trim().max(PROFILE_RULES.title.maxLength),
		bio: z.string().max(PROFILE_RULES.bio.maxLength),
		location: optionalText(PROFILE_RULES.location.maxLength),
		email: z.preprocess(
			(value) => (value === '' || value === null ? undefined : value),
			z.email().optional(),
		),
		website: z.preprocess(
			(value) => (value === '' || value === null ? undefined : value),
			httpUrl.optional(),
		),
		portraitImage: z.literal('portrait.webp').optional(),
	})
	.strict()

const nullableSchema = <T>(schema: z.ZodType<T>) =>
	z.custom<T | null>(
		(value) => value === null || schema.safeParse(value).success,
	)

export const siteSocialFileSchema = nullableSchema(
	z.array(socialLinkSchema).max(100),
)
export const siteSkillsFileSchema = nullableSchema(
	z.array(skillSchema).max(100),
)
export const siteSlogansFileSchema = nullableSchema(
	z.array(sloganSchema).max(100),
)
export const siteThemeFileSchema = nullableSchema(themeConfigSchema)

const siteLandingObjectSchema = z
	.object({
		enabled: z.boolean().optional(),
		showTopHottest: z.boolean().optional(),
		showSlogans: z.boolean().optional(),
		showPinnedPosts: z.boolean().optional(),
		showLatestPosts: z.boolean().optional(),
		pinnedPostSlugs: z
			.array(z.string().trim().min(1).max(200))
			.max(100)
			.optional(),
	})
	.strict()
	.superRefine((value, context) => {
		const slugs = value.pinnedPostSlugs ?? []
		if (new Set(slugs).size !== slugs.length)
			context.addIssue({
				code: 'custom',
				path: ['pinnedPostSlugs'],
				message: '置顶文章 slug 不能重复',
			})
	})

export const siteLandingFileSchema = nullableSchema(siteLandingObjectSchema)
export const siteAboutFileSchema = nullableSchema(aboutPageConfigSchema)

export const siteFileSchemaByName = {
	'profile.yaml': siteProfileFileSchema,
	'social.yaml': siteSocialFileSchema,
	'skills.yaml': siteSkillsFileSchema,
	'slogans.yaml': siteSlogansFileSchema,
	'theme.yaml': siteThemeFileSchema,
	'landing.yaml': siteLandingFileSchema,
	'about.yaml': siteAboutFileSchema,
}

export type SiteProfileFile = z.infer<typeof siteProfileFileSchema>
export type SiteThemeFile = ThemeConfig | null
export type SiteLandingFile = SiteLandingFileConfig | null
export type SiteAboutFile = AboutPageConfig | null

export interface SiteFiles {
	profile: SiteProfileFile
	social: SocialLink[] | null
	skills: Skill[] | null
	slogans: Slogan[] | null
	theme: SiteThemeFile
	landing: SiteLandingFile
	about: SiteAboutFile
}
