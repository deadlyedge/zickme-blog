'use client'

import {
	ArrowLeft,
	Layout,
	Palette,
	Pin,
	Plus,
	Save,
	Trash2,
	User,
} from 'lucide-react'
import Link from 'next/link'
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
import { Field, FieldLabel } from '@/components/ui/field'
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
	const [themePreset, setThemePreset] = useState<string>(
		initialProfile?.themeConfig?.preset || 'default',
	)
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

	// 选择预设主题时自动填充变量
	const handleSelectPreset = (presetId: string) => {
		setThemePreset(presetId)
		const found = THEME_PRESETS.find((p) => p.id === presetId)
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

	// 保存所有设置
	const handleSaveAll = () => {
		startTransition(async () => {
			try {
				const themeConfig: ThemeConfig = {
					preset: themePreset as
						| 'default'
						| 'minimal-slate'
						| 'cyber-green'
						| 'warm-amber'
						| 'custom',
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
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-8 max-w-6xl pb-24">
				{/* 顶部导航与保存按钮 */}
				<div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
					<div className="flex items-center gap-4">
						<Button asChild variant="outline" size="sm">
							<Link href="/dashboard">
								<ArrowLeft className="h-4 w-4 mr-2" />
								返回控制台
							</Link>
						</Button>
						<div>
							<h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
								站点定制与页面可视化配置
							</h1>
							<p className="text-sm text-muted-foreground">
								动态调整主题调色板、首页模块开关与置顶、About 页面经历与项目
							</p>
						</div>
					</div>

					<Button
						onClick={handleSaveAll}
						disabled={isPending}
						className="gap-2 shadow-sm"
					>
						<Save className="h-4 w-4" />
						{isPending ? '保存中...' : '保存全部配置'}
					</Button>
				</div>

				{/* 核心配置 Tabs */}
				<Tabs defaultValue="theming" className="w-full space-y-6">
					<TabsList className="grid grid-cols-3 max-w-md">
						<TabsTrigger value="theming" className="gap-2">
							<Palette className="h-4 w-4" />
							<span>动态主题</span>
						</TabsTrigger>
						<TabsTrigger value="landing" className="gap-2">
							<Layout className="h-4 w-4" />
							<span>Landing 首页</span>
						</TabsTrigger>
						<TabsTrigger value="about" className="gap-2">
							<User className="h-4 w-4" />
							<span>About 履历</span>
						</TabsTrigger>
					</TabsList>

					{/* 1. 主题与样式编辑器 */}
					<TabsContent value="theming" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Palette className="h-5 w-5 text-primary" />
									预设调色板与配色方案
								</CardTitle>
								<CardDescription>
									选择内置精心调配的 Shadcn / Tailwind 4
									配色系统，免重新编译热更新。
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{THEME_PRESETS.map((preset) => {
										const isSelected = themePreset === preset.id
										return (
											<div
												key={preset.id}
												onClick={() => handleSelectPreset(preset.id)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														handleSelectPreset(preset.id)
													}
												}}
												className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
													isSelected
														? 'border-primary ring-2 ring-primary/20 bg-primary/5'
														: 'hover:border-border/80 hover:bg-muted/40'
												}`}
											>
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<span className="font-bold text-sm">
															{preset.name}
														</span>
														<div
															className={`size-3.5 rounded-full ${preset.badgeColor}`}
														/>
													</div>
													<p className="text-xs text-muted-foreground leading-relaxed">
														{preset.description}
													</p>
												</div>

												<div className="pt-4 flex items-center justify-between text-xs font-medium">
													<Badge variant={isSelected ? 'default' : 'secondary'}>
														{isSelected ? '生效中' : '点击应用'}
													</Badge>
												</div>
											</div>
										)
									})}
								</div>

								{/* 自定义 CSS 变量与额外样式 */}
								<div className="space-y-4 pt-4 border-t">
									<div className="space-y-1">
										<h4 className="text-sm font-semibold">
											自定义 CSS 变量注入 (shadcn / globals.css 格式)
										</h4>
										<p className="text-xs text-muted-foreground">
											支持直接编写自定义全局 CSS 代码，将被动态挂载至 HTML Head
											标签。
										</p>
									</div>

									<Textarea
										value={customCss}
										onChange={(e) => setCustomCss(e.target.value)}
										placeholder=":root { --radius: 0.75rem; }"
										rows={6}
										className="font-mono text-xs"
									/>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* 2. Landing Page 模块与置顶管理 */}
					<TabsContent value="landing" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Layout className="h-5 w-5 text-primary" />
									首页区块组合与开关
								</CardTitle>
								<CardDescription>
									控制首页各个展示分区的可见性与落地页行为。若关闭落地页，访问首页将直接定向至文章流。
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
										<div className="space-y-0.5">
											<div className="font-semibold text-sm">
												开启 Landing Page
											</div>
											<div className="text-xs text-muted-foreground">
												关闭后访问 / 将自动跳转至 /posts 文章流
											</div>
										</div>
										<Switch
											checked={landingEnabled}
											onCheckedChange={setLandingEnabled}
										/>
									</div>

									<div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
										<div className="space-y-0.5">
											<div className="font-semibold text-sm">
												TOP 5 热门文章翻页动效区
											</div>
											<div className="text-xs text-muted-foreground">
												展示全站评论/热度最高的 5 篇文章 3D 卡片
											</div>
										</div>
										<Switch
											checked={showTopHottest}
											onCheckedChange={setShowTopHottest}
										/>
									</div>

									<div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
										<div className="space-y-0.5">
											<div className="font-semibold text-sm">
												口号视差滚动区 (Slogans)
											</div>
											<div className="text-xs text-muted-foreground">
												展示个人宣言与技术座右铭
											</div>
										</div>
										<Switch
											checked={showSlogans}
											onCheckedChange={setShowSlogans}
										/>
									</div>

									<div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
										<div className="space-y-0.5">
											<div className="font-semibold text-sm">
												置顶推荐文章区 (Pinned Posts)
											</div>
											<div className="text-xs text-muted-foreground">
												展示管理员手动指定的置顶精选文章
											</div>
										</div>
										<Switch
											checked={showPinnedPosts}
											onCheckedChange={setShowPinnedPosts}
										/>
									</div>

									<div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
										<div className="space-y-0.5">
											<div className="font-semibold text-sm">
												最新发布文章瀑布区 (Latest Posts)
											</div>
											<div className="text-xs text-muted-foreground">
												按时间倒序展示最新的发布文章网格
											</div>
										</div>
										<Switch
											checked={showLatestPosts}
											onCheckedChange={setShowLatestPosts}
										/>
									</div>
								</div>

								{/* 可视化置顶文章选择器 */}
								<div className="pt-6 border-t space-y-4">
									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<h4 className="text-sm font-semibold flex items-center gap-2">
												<Pin className="h-4 w-4 text-primary" />
												置顶文章选择 (Pinned Posts Selector)
											</h4>
											<p className="text-xs text-muted-foreground">
												点击文章卡片将其添加或移出首页“置顶推荐”区块（已选{' '}
												{pinnedPostIds.length} 篇）
											</p>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
													className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-3 ${
														isPinned
															? 'border-primary ring-2 ring-primary/20 bg-primary/5'
															: 'hover:border-border/80 bg-card'
													}`}
												>
													<div className="space-y-1.5">
														<div className="flex items-start justify-between gap-2">
															<span className="font-bold text-sm line-clamp-1">
																{post.title}
															</span>
															{isPinned && (
																<Badge
																	variant="default"
																	className="text-[10px]"
																>
																	已置顶
																</Badge>
															)}
														</div>
														<p className="text-xs text-muted-foreground line-clamp-2">
															{post.excerpt || '暂无摘要'}
														</p>
													</div>

													<div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
														<span>/posts/{post.slug}</span>
														<span>
															{new Date(
																post.publishedAt || post.createdAt,
															).toLocaleDateString('zh-CN')}
														</span>
													</div>
												</div>
											)
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* 3. About 页面内容编辑器 */}
					<TabsContent value="about" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<User className="h-5 w-5 text-primary" />
									About 导语与状态维护
								</CardTitle>
								<CardDescription>
									自定义关于页面的大字号标语、自我定位与实时在线状态。
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Field>
									<FieldLabel>页面大标题 (Headline)</FieldLabel>
									<InputGroup>
										<InputGroupInput
											value={aboutHeadline}
											onChange={(e) => setAboutHeadline(e.target.value)}
											placeholder="Hi, I'm Zick — Senior Full Stack Engineer."
										/>
									</InputGroup>
								</Field>

								<Field>
									<FieldLabel>副标题 / 导语描述 (Subheadline)</FieldLabel>
									<Textarea
										value={aboutSubheadline}
										onChange={(e) => setAboutSubheadline(e.target.value)}
										placeholder="A comprehensive introduction to my philosophy and architectural focus..."
										rows={3}
									/>
								</Field>

								<Field>
									<FieldLabel>实时在线状态文本 (Status Badge)</FieldLabel>
									<InputGroup>
										<InputGroupInput
											value={aboutStatusText}
											onChange={(e) => setAboutStatusText(e.target.value)}
											placeholder="Available for new opportunities / Based in Shenzhen"
										/>
									</InputGroup>
								</Field>
							</CardContent>
						</Card>

						{/* 职业经历时间线维护 */}
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-lg">
										职业生涯经历 (Career Timeline)
									</CardTitle>
									<CardDescription>
										管理关于页面的工作履历、职责描述与成就亮点
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
										className="p-4 rounded-xl border bg-muted/20 space-y-3 relative group"
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

										<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
											<div>
												<FieldLabel className="text-xs">职位名称</FieldLabel>
												<InputGroup>
													<InputGroupInput
														value={item.role}
														onChange={(e) => {
															const updated = [...careerTimeline]
															updated[index].role = e.target.value
															setCareerTimeline(updated)
														}}
														placeholder="Tech Lead / Senior Engineer"
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
														placeholder="Acme Inc."
													/>
												</InputGroup>
											</div>

											<div>
												<FieldLabel className="text-xs">
													任职周期 (Period)
												</FieldLabel>
												<InputGroup>
													<InputGroupInput
														value={item.period}
														onChange={(e) => {
															const updated = [...careerTimeline]
															updated[index].period = e.target.value
															setCareerTimeline(updated)
														}}
														placeholder="2022 - Present"
													/>
												</InputGroup>
											</div>
										</div>

										<div>
											<FieldLabel className="text-xs">
												工作概要与系统架构
											</FieldLabel>
											<Textarea
												value={item.description || ''}
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
						<Card>
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
		</div>
	)
}
