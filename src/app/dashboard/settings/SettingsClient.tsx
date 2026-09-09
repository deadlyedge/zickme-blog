'use client'

import { Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { SettingsTabs } from '@/components/dashboard/settings'
import { Button } from '@/components/ui/button'
import { updateSiteProfile } from '@/lib/actions/profile'
import { THEME_PRESETS } from '@/lib/theme'
import type {
	AboutPageConfig,
	FeaturedProject,
	LandingPageConfig,
	PostWithTags,
	SiteProfile,
	Skill,
	Slogan,
	SocialLink,
	ThemeConfig,
	TimelineItem,
} from '@/types'

interface SettingsClientProps {
	initialProfile: SiteProfile | null
	allPosts: PostWithTags[]
}

type EditableSocialLink = SocialLink & { id: string }

export function SettingsClient({
	initialProfile,
	allPosts,
}: SettingsClientProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()

	// 1. 主题状态
	const [themePreset, setThemePreset] = useState<
		'default' | 'minimal-slate' | 'cyber-green' | 'warm-amber' | 'custom'
	>(initialProfile?.themeConfig?.preset || 'default')
	const [customCss, setCustomCss] = useState<string>(
		initialProfile?.themeConfig?.customCss || '',
	)
	const [lightVars, setLightVars] = useState<Record<string, string>>(
		(initialProfile?.themeConfig?.light as Record<string, string>) || {},
	)
	const [darkVars, setDarkVars] = useState<Record<string, string>>(
		(initialProfile?.themeConfig?.dark as Record<string, string>) || {},
	)

	// 2. Landing Page 开关状态
	const [landingEnabled, setLandingEnabled] = useState<boolean>(
		initialProfile?.landingPageConfig?.enabled ?? true,
	)
	const [showTopHottest, setShowTopHottest] = useState<boolean>(
		initialProfile?.landingPageConfig?.showTopHottest ?? true,
	)
	const [showSlogans, setShowSlogans] = useState<boolean>(
		initialProfile?.landingPageConfig?.showSlogans ?? true,
	)
	const [showPinnedPosts, setShowPinnedPosts] = useState<boolean>(
		initialProfile?.landingPageConfig?.showPinnedPosts ?? true,
	)
	const [showLatestPosts, setShowLatestPosts] = useState<boolean>(
		initialProfile?.landingPageConfig?.showLatestPosts ?? true,
	)
	const [pinnedPostIds, setPinnedPostIds] = useState<string[]>(
		initialProfile?.landingPageConfig?.pinnedPostIds ?? [],
	)
	const [slogans, setSlogans] = useState<Slogan[]>(
		(initialProfile?.slogans ?? []).map((slogan) => ({
			...slogan,
			id: slogan.id ?? crypto.randomUUID(),
		})),
	)
	const [socialLinks, setSocialLinks] = useState<EditableSocialLink[]>(
		(initialProfile?.socialLinks ?? []).map((link) => ({
			...link,
			id: crypto.randomUUID(),
		})),
	)

	// 3. About Page 结构化数据状态
	const [aboutHeadline, setAboutHeadline] = useState<string>(
		initialProfile?.aboutPageConfig?.headline || '',
	)
	const [aboutSubheadline, setAboutSubheadline] = useState<string>(
		initialProfile?.aboutPageConfig?.subheadline || '',
	)
	const [aboutStatusText, setAboutStatusText] = useState<string>(
		initialProfile?.aboutPageConfig?.statusText || '',
	)

	// 经历时间线
	const [careerTimeline, setCareerTimeline] = useState<TimelineItem[]>(
		initialProfile?.aboutPageConfig?.careerTimeline || [],
	)

	// 教育时间线
	const [educationTimeline, _setEducationTimeline] = useState<TimelineItem[]>(
		initialProfile?.aboutPageConfig?.educationTimeline || [],
	)

	// 精选项目
	const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>(
		initialProfile?.aboutPageConfig?.featuredProjects || [],
	)
	const [name, setName] = useState(initialProfile?.name ?? '')
	const [title, setTitle] = useState(initialProfile?.title ?? '')
	const [bio, setBio] = useState(initialProfile?.bio ?? '')
	const [avatar, setAvatar] = useState(initialProfile?.avatar ?? '')
	const [location, setLocation] = useState(initialProfile?.location ?? '')
	const [email, setEmail] = useState(initialProfile?.email ?? '')
	const [website, setWebsite] = useState(initialProfile?.website ?? '')
	const [skills, setSkills] = useState<Skill[]>(
		(initialProfile?.skills ?? []).map((skill) => ({
			...skill,
			id: skill.id ?? crypto.randomUUID(),
			technologies: skill.technologies.map((technology) => ({
				...technology,
				id: technology.id || crypto.randomUUID(),
			})),
		})),
	)

	const updateSkill = (index: number, field: 'category', value: string) => {
		setSkills((current) =>
			current.map((skill, skillIndex) =>
				skillIndex === index ? { ...skill, [field]: value } : skill,
			),
		)
	}

	const updateTechnology = (
		skillIndex: number,
		technologyIndex: number,
		field: 'name' | 'level',
		value: string,
	) => {
		setSkills((current) =>
			current.map((skill, currentSkillIndex) =>
				currentSkillIndex === skillIndex
					? {
							...skill,
							technologies: skill.technologies.map(
								(technology, currentTechnologyIndex) =>
									currentTechnologyIndex === technologyIndex
										? { ...technology, [field]: value }
										: technology,
							),
						}
					: skill,
			),
		)
	}

	const addSkill = () =>
		setSkills((current) => [
			...current,
			{
				id: crypto.randomUUID(),
				category: 'Frontend',
				technologies: [
					{ id: crypto.randomUUID(), name: '', level: 'intermediate' },
				],
			},
		])
	const removeSkill = (index: number) =>
		setSkills((current) =>
			current.filter((_, skillIndex) => skillIndex !== index),
		)
	const addTechnology = (skillIndex: number) =>
		setSkills((current) =>
			current.map((skill, index) =>
				index === skillIndex
					? {
							...skill,
							technologies: [
								...skill.technologies,
								{ id: crypto.randomUUID(), name: '', level: 'intermediate' },
							],
						}
					: skill,
			),
		)
	const removeTechnology = (skillIndex: number, technologyIndex: number) =>
		setSkills((current) =>
			current.map((skill, index) =>
				index === skillIndex
					? {
							...skill,
							technologies: skill.technologies.filter(
								(_, technologyIndexInSkill) =>
									technologyIndexInSkill !== technologyIndex,
							),
						}
					: skill,
			),
		)

	// 应用预设主题变量
	const handleApplyPreset = (presetKey: string) => {
		setThemePreset(
			presetKey as
				| 'default'
				| 'minimal-slate'
				| 'cyber-green'
				| 'warm-amber'
				| 'custom',
		)
		const found = THEME_PRESETS.find((p) => p.id === presetKey)
		if (found) {
			setLightVars((found.config.light as Record<string, string>) || {})
			setDarkVars((found.config.dark as Record<string, string>) || {})
		}
	}

	// 切换置顶文章
	const togglePinnedPost = (postId: string) => {
		setPinnedPostIds((prev) =>
			prev.includes(postId)
				? prev.filter((id) => id !== postId)
				: [...prev, postId],
		)
	}

	const updateSlogan = (index: number, field: keyof Slogan, value: string) => {
		setSlogans((current) =>
			current.map((slogan, sloganIndex) =>
				sloganIndex === index ? { ...slogan, [field]: value } : slogan,
			),
		)
	}

	const addSlogan = () =>
		setSlogans((current) => [...current, { id: crypto.randomUUID(), text: '' }])
	const removeSlogan = (index: number) =>
		setSlogans((current) =>
			current.filter((_, sloganIndex) => sloganIndex !== index),
		)

	const updateSocialLink = (
		id: string,
		field: keyof SocialLink,
		value: string,
	) => {
		setSocialLinks((current) =>
			current.map((link) =>
				link.id === id ? { ...link, [field]: value } : link,
			),
		)
	}

	const addSocialLink = () =>
		setSocialLinks((current) => [
			...current,
			{
				id: crypto.randomUUID(),
				platform: 'GitHub',
				url: '',
				username: '',
			},
		])

	const removeSocialLink = (id: string) =>
		setSocialLinks((current) => current.filter((link) => link.id !== id))

	// 添加经历项
	const addCareerItem = () => {
		const newItem: TimelineItem = {
			id: `career-${Date.now()}`,
			role: 'Software Engineer',
			company: 'Tech Company',
			period: '2024 - Present',
			location: 'Remote',
			description: 'Description of responsibilities...',
			achievements: ['Achievement 1', 'Achievement 2'],
			technologies: ['TypeScript', 'React'],
		}
		setCareerTimeline([...careerTimeline, newItem])
	}

	// 添加精选项目
	const addFeaturedProject = () => {
		const newProject: FeaturedProject = {
			id: `project-${Date.now()}`,
			title: 'Awesome App',
			description: 'A developer-first productivity application.',
			githubUrl: 'https://github.com/example/project',
			url: 'https://project.example.com',
			stars: '1.2k',
			tags: ['Next.js', 'Tailwind', 'AI'],
		}
		setFeaturedProjects([...featuredProjects, newProject])
	}

	// 保存全部配置
	const handleSaveAll = () => {
		startTransition(async () => {
			try {
				const themeConfig: ThemeConfig = {
					preset: themePreset,
					customCss,
					light: lightVars,
					dark: darkVars,
				}

				const landingPageConfig: LandingPageConfig = {
					enabled: landingEnabled,
					showTopHottest,
					showSlogans,
					showPinnedPosts,
					showLatestPosts,
					pinnedPostIds,
				}

				const aboutPageConfig: AboutPageConfig = {
					headline: aboutHeadline,
					subheadline: aboutSubheadline,
					statusText: aboutStatusText,
					careerTimeline,
					educationTimeline,
					featuredProjects,
				}

				await updateSiteProfile({
					name,
					title,
					bio,
					avatar: avatar || undefined,
					location: location || undefined,
					email: email || undefined,
					website: website || undefined,
					slogans,
					skills,
					socialLinks: socialLinks.map(({ id: _id, ...link }) => link),
					themeConfig,
					landingPageConfig,
					aboutPageConfig,
				})

				toast.success('站点配置已成功保存并立即生效！')
				router.refresh()
			} catch (error) {
				console.error('Save error:', error)
				toast.error(error instanceof Error ? error.message : '保存配置失败')
			}
		})
	}

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-6xl pb-24">
			{/* 顶部标题与保存按钮 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
						站点定制与页面可视化配置
					</h1>
					<p className="text-sm text-muted-foreground">
						动态调整主题调色板、首页模块开关与置顶、About 页面经历与项目
					</p>
				</div>

				<Button
					size="lg"
					onClick={handleSaveAll}
					disabled={isPending}
					className="gap-2 shadow-xs self-start sm:self-auto"
				>
					<Save className="h-4 w-4" />
					{isPending ? '正在保存...' : '保存全部修改'}
				</Button>
			</div>

			<SettingsTabs
				themePreset={themePreset}
				customCss={customCss}
				landingEnabled={landingEnabled}
				showTopHottest={showTopHottest}
				showSlogans={showSlogans}
				showPinnedPosts={showPinnedPosts}
				showLatestPosts={showLatestPosts}
				pinnedPostIds={pinnedPostIds}
				slogans={slogans}
				socialLinks={socialLinks}
				aboutHeadline={aboutHeadline}
				aboutSubheadline={aboutSubheadline}
				aboutStatusText={aboutStatusText}
				careerTimeline={careerTimeline}
				featuredProjects={featuredProjects}
				name={name}
				title={title}
				bio={bio}
				avatar={avatar}
				location={location}
				email={email}
				website={website}
				skills={skills}
				allPosts={allPosts}
				setCustomCss={setCustomCss}
				setLandingEnabled={setLandingEnabled}
				setShowTopHottest={setShowTopHottest}
				setShowSlogans={setShowSlogans}
				setShowPinnedPosts={setShowPinnedPosts}
				setShowLatestPosts={setShowLatestPosts}
				setAboutHeadline={setAboutHeadline}
				setAboutSubheadline={setAboutSubheadline}
				setAboutStatusText={setAboutStatusText}
				setCareerTimeline={setCareerTimeline}
				setFeaturedProjects={setFeaturedProjects}
				setName={setName}
				setTitle={setTitle}
				setBio={setBio}
				setAvatar={setAvatar}
				setLocation={setLocation}
				setEmail={setEmail}
				setWebsite={setWebsite}
				updateSkill={updateSkill}
				updateTechnology={updateTechnology}
				addSkill={addSkill}
				removeSkill={removeSkill}
				addTechnology={addTechnology}
				removeTechnology={removeTechnology}
				handleApplyPreset={handleApplyPreset}
				togglePinnedPost={togglePinnedPost}
				updateSlogan={updateSlogan}
				addSlogan={addSlogan}
				removeSlogan={removeSlogan}
				updateSocialLink={updateSocialLink}
				addSocialLink={addSocialLink}
				removeSocialLink={removeSocialLink}
				addCareerItem={addCareerItem}
				addFeaturedProject={addFeaturedProject}
			/>
		</div>
	)
}
