import { Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import type { SettingsTabsProps } from './types'

type AboutSettingsProps = Pick<
	SettingsTabsProps,
	| 'aboutHeadline'
	| 'aboutSubheadline'
	| 'aboutStatusText'
	| 'careerTimeline'
	| 'featuredProjects'
	| 'setAboutHeadline'
	| 'setAboutSubheadline'
	| 'setAboutStatusText'
	| 'setCareerTimeline'
	| 'setFeaturedProjects'
	| 'addCareerItem'
	| 'addFeaturedProject'
>

export function AboutSettings({
	aboutHeadline,
	aboutSubheadline,
	aboutStatusText,
	careerTimeline,
	featuredProjects,
	setAboutHeadline,
	setAboutSubheadline,
	setAboutStatusText,
	setCareerTimeline,
	setFeaturedProjects,
	addCareerItem,
	addFeaturedProject,
}: AboutSettingsProps) {
	return (
		<>
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
						<FieldLabel className="text-xs">副标语 (Subheadline)</FieldLabel>
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
						<CardDescription>展示在关于页面的代表作与开源实验</CardDescription>
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
									<FieldLabel className="text-xs">GitHub 仓库地址</FieldLabel>
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
		</>
	)
}
