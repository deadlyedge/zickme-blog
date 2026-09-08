'use client'

import { Layout, Palette, Pin, Plus, Save, Trash2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { updateSiteProfile } from '@/lib/actions/profile'
import { THEME_PRESETS } from '@/lib/theme'
import type {
	AboutPageConfig,
	FeaturedProject,
	LandingPageConfig,
	PostWithTags,
	SiteProfile,
	ThemeConfig,
	TimelineItem,
} from '@/types'

interface SettingsClientProps {
	initialProfile: SiteProfile | null
	allPosts: PostWithTags[]
}

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
					name: initialProfile?.name || 'Zick',
					title: initialProfile?.title || 'Engineer',
					bio: initialProfile?.bio || '',
					avatar: initialProfile?.avatar || undefined,
					location: initialProfile?.location || undefined,
					email: initialProfile?.email || undefined,
					website: initialProfile?.website || undefined,
					slogans: initialProfile?.slogans || undefined,
					skills: initialProfile?.skills || undefined,
					socialLinks: initialProfile?.socialLinks || undefined,
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

			{/* 选项卡面板 */}
			<Tabs defaultValue="theme" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3 max-w-md shadow-2xs">
					<TabsTrigger value="theme" className="gap-2 text-xs sm:text-sm">
						<Palette className="h-3.5 w-3.5" />
						动态主题
					</TabsTrigger>
					<TabsTrigger value="landing" className="gap-2 text-xs sm:text-sm">
						<Layout className="h-3.5 w-3.5" />
						首页编排
					</TabsTrigger>
					<TabsTrigger value="about" className="gap-2 text-xs sm:text-sm">
						<User className="h-3.5 w-3.5" />
						关于页内容
					</TabsTrigger>
				</TabsList>

				{/* 1. 动态主题定制 */}
				<TabsContent value="theme" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-lg">
								主题调色板预设 (Theme Presets)
							</CardTitle>
							<CardDescription>
								选择全站经典配色预设，或在下方自定义 CSS 变量覆盖
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
								{THEME_PRESETS.map((preset) => {
									const isSelected = themePreset === preset.id
									return (
										<div
											key={preset.id}
											onClick={() => handleApplyPreset(preset.id)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													handleApplyPreset(preset.id)
												}
											}}
											className={`p-4 rounded-xl border-2 cursor-pointer transition-all space-y-3 ${
												isSelected
													? 'border-primary bg-primary/5 shadow-xs'
													: 'border-border/60 hover:border-primary/40 bg-card'
											}`}
										>
											<div className="flex items-center justify-between">
												<span className="font-bold text-sm">{preset.name}</span>
												{isSelected && (
													<Badge className="text-[10px] px-1.5 py-0">
														当前激活
													</Badge>
												)}
											</div>
											<div className="flex items-center gap-2">
												<div
													className="size-5 rounded-full border shadow-2xs"
													style={{
														backgroundColor:
															preset.config.light?.primary || '#000',
													}}
												/>
												<div
													className="size-5 rounded-full border shadow-2xs"
													style={{
														backgroundColor:
															preset.config.light?.background || '#fff',
													}}
												/>
												<div
													className="size-5 rounded-full border shadow-2xs"
													style={{
														backgroundColor:
															preset.config.dark?.background || '#09090b',
													}}
												/>
											</div>
											<p className="text-xs text-muted-foreground line-clamp-2">
												{preset.description}
											</p>
										</div>
									)
								})}
							</div>

							<div className="space-y-3 pt-4 border-t">
								<FieldLabel>全局注入自定义 CSS 代码 (可选)</FieldLabel>
								<Textarea
									value={customCss}
									onChange={(e) => setCustomCss(e.target.value)}
									placeholder=":root { --custom-glow: #38bdf8; }"
									rows={4}
									className="font-mono text-xs"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 2. 首页模块编排 */}
				<TabsContent value="landing" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-lg">首页分区块与开关编排</CardTitle>
							<CardDescription>
								按需开启或隐藏 Landing Page 各功能区块
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
									<div className="space-y-0.5">
										<FieldLabel className="text-sm font-bold">
											Landing Page 落地页总开关
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											若关闭，访问首页将直接重定向至文章列表
										</p>
									</div>
									<Switch
										checked={landingEnabled}
										onCheckedChange={setLandingEnabled}
									/>
								</div>

								<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
									<div className="space-y-0.5">
										<FieldLabel className="text-sm font-bold">
											TOP 5 热门文章 3D 翻页区
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											在首页置顶呈现全站热议文章轮播
										</p>
									</div>
									<Switch
										checked={showTopHottest}
										onCheckedChange={setShowTopHottest}
									/>
								</div>

								<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
									<div className="space-y-0.5">
										<FieldLabel className="text-sm font-bold">
											Slogan 视差口号区
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											展示多条视差滚动的品牌 Slogan
										</p>
									</div>
									<Switch
										checked={showSlogans}
										onCheckedChange={setShowSlogans}
									/>
								</div>

								<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
									<div className="space-y-0.5">
										<FieldLabel className="text-sm font-bold">
											置顶精选文章区 (Pinned Posts)
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											在首页重点展示管理员勾选的置顶文章
										</p>
									</div>
									<Switch
										checked={showPinnedPosts}
										onCheckedChange={setShowPinnedPosts}
									/>
								</div>

								<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
									<div className="space-y-0.5">
										<FieldLabel className="text-sm font-bold">
											最新发布文章区 (Latest Posts)
										</FieldLabel>
										<p className="text-xs text-muted-foreground">
											展示近期最新发布的文章瀑布流
										</p>
									</div>
									<Switch
										checked={showLatestPosts}
										onCheckedChange={setShowLatestPosts}
									/>
								</div>
							</div>

							{/* 置顶文章选择器 */}
							<div className="pt-6 border-t space-y-3">
								<div className="flex items-center justify-between">
									<FieldLabel className="text-sm font-bold flex items-center gap-2">
										<Pin className="h-4 w-4 text-primary" />
										配置置顶文章 (已勾选: {pinnedPostIds.length} 篇)
									</FieldLabel>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-2 border rounded-xl bg-muted/10">
									{allPosts.map((post) => {
										const isPinned = pinnedPostIds.includes(post.id)
										return (
											<div
												key={post.id}
												onClick={() => togglePinnedPost(post.id)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														togglePinnedPost(post.id)
													}
												}}
												className={`p-3 rounded-lg border text-left cursor-pointer transition-all space-y-1 ${
													isPinned
														? 'border-primary bg-primary/10 shadow-xs'
														: 'border-border/60 hover:border-border bg-card'
												}`}
											>
												<div className="flex items-center justify-between">
													<Badge
														variant={isPinned ? 'default' : 'outline'}
														className="text-[10px] px-1.5 py-0"
													>
														{isPinned ? '已置顶' : '未置顶'}
													</Badge>
												</div>
												<div className="font-semibold text-xs line-clamp-1">
													{post.title}
												</div>
												<div className="text-[10px] text-muted-foreground line-clamp-1">
													/{post.slug}
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 3. 关于页内容管理 */}
				<TabsContent value="about" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-lg">Hero 个人导语与在线状态</CardTitle>
							<CardDescription>配置关于页面顶部的标语与状态</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<FieldLabel className="text-xs">主标语 (Headline)</FieldLabel>
								<InputGroup>
									<InputGroupInput
										value={aboutHeadline}
										onChange={(e) => setAboutHeadline(e.target.value)}
										placeholder="e.g. Full-Stack Engineer & Designer"
									/>
								</InputGroup>
							</div>

							<div>
								<FieldLabel className="text-xs">
									副标语 (Subheadline)
								</FieldLabel>
								<InputGroup>
									<InputGroupInput
										value={aboutSubheadline}
										onChange={(e) => setAboutSubheadline(e.target.value)}
										placeholder="e.g. Building delightful web experiences..."
									/>
								</InputGroup>
							</div>

							<div>
								<FieldLabel className="text-xs">
									在线状态标识 (Status Badge)
								</FieldLabel>
								<InputGroup>
									<InputGroupInput
										value={aboutStatusText}
										onChange={(e) => setAboutStatusText(e.target.value)}
										placeholder="e.g. Available for interesting projects"
									/>
								</InputGroup>
							</div>
						</CardContent>
					</Card>

					{/* 职业经历时间线维护 */}
					<Card className="shadow-2xs">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-lg">
									职业经历时间线 (Career Timeline)
								</CardTitle>
								<CardDescription>
									管理关于页面的工作经历与重要里程碑
								</CardDescription>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={addCareerItem}
								className="gap-1 text-xs"
							>
								<Plus className="h-3.5 w-3.5" />
								添加经历
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{careerTimeline.map((item, index) => (
								<div
									key={item.id || `career-${index}`}
									className="p-4 rounded-xl border bg-muted/20 space-y-3 relative"
								>
									<div className="flex items-center justify-between">
										<span className="font-bold text-xs text-primary uppercase">
											经历 #{index + 1}
										</span>
										<Button
											size="icon-sm"
											variant="ghost"
											className="text-destructive hover:bg-destructive/10"
											onClick={() =>
												setCareerTimeline(
													careerTimeline.filter((_, i) => i !== index),
												)
											}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
										<div>
											<FieldLabel className="text-xs">职位 / 角色</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={item.role}
													onChange={(e) => {
														const updated = [...careerTimeline]
														updated[index].role = e.target.value
														setCareerTimeline(updated)
													}}
													placeholder="Software Engineer"
												/>
											</InputGroup>
										</div>

										<div>
											<FieldLabel className="text-xs">公司 / 组织</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={item.company}
													onChange={(e) => {
														const updated = [...careerTimeline]
														updated[index].company = e.target.value
														setCareerTimeline(updated)
													}}
													placeholder="Company Name"
												/>
											</InputGroup>
										</div>

										<div>
											<FieldLabel className="text-xs">时间周期</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={item.period}
													onChange={(e) => {
														const updated = [...careerTimeline]
														updated[index].period = e.target.value
														setCareerTimeline(updated)
													}}
													placeholder="2023 - Present"
												/>
											</InputGroup>
										</div>
									</div>

									<div>
										<FieldLabel className="text-xs">职责与成就描述</FieldLabel>
										<Textarea
											value={item.description}
											onChange={(e) => {
												const updated = [...careerTimeline]
												updated[index].description = e.target.value
												setCareerTimeline(updated)
											}}
											placeholder="Briefly describe the architectural impact..."
											rows={2}
											className="text-xs"
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					{/* 精选项目维护 */}
					<Card className="shadow-2xs">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-lg">
									精选项目与开源亮点 (Featured Projects)
								</CardTitle>
								<CardDescription>
									展示在关于页面的代表作与开源实验
								</CardDescription>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={addFeaturedProject}
								className="gap-1 text-xs"
							>
								<Plus className="h-3.5 w-3.5" />
								添加项目
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{featuredProjects.map((proj, pIndex) => (
								<div
									key={proj.id || `proj-${pIndex}`}
									className="p-4 rounded-xl border bg-muted/20 space-y-3 relative"
								>
									<div className="flex items-center justify-between">
										<span className="font-bold text-xs text-primary uppercase">
											项目 #{pIndex + 1}
										</span>
										<Button
											size="icon-sm"
											variant="ghost"
											className="text-destructive hover:bg-destructive/10"
											onClick={() =>
												setFeaturedProjects(
													featuredProjects.filter((_, i) => i !== pIndex),
												)
											}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</Button>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div>
											<FieldLabel className="text-xs">项目名称</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={proj.title}
													onChange={(e) => {
														const updated = [...featuredProjects]
														updated[pIndex].title = e.target.value
														setFeaturedProjects(updated)
													}}
													placeholder="Project Title"
												/>
											</InputGroup>
										</div>

										<div>
											<FieldLabel className="text-xs">
												GitHub 仓库地址
											</FieldLabel>
											<InputGroup>
												<InputGroupInput
													value={proj.githubUrl || ''}
													onChange={(e) => {
														const updated = [...featuredProjects]
														updated[pIndex].githubUrl = e.target.value
														setFeaturedProjects(updated)
													}}
													placeholder="https://github.com/user/repo"
												/>
											</InputGroup>
										</div>
									</div>

									<div>
										<FieldLabel className="text-xs">项目描述</FieldLabel>
										<Textarea
											value={proj.description}
											onChange={(e) => {
												const updated = [...featuredProjects]
												updated[pIndex].description = e.target.value
												setFeaturedProjects(updated)
											}}
											placeholder="Short introduction..."
											rows={2}
											className="text-xs"
										/>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
