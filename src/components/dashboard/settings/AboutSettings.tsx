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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
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
	| 'name'
	| 'title'
	| 'bio'
	| 'avatar'
	| 'location'
	| 'email'
	| 'website'
	| 'skills'
	| 'slogans'
	| 'setName'
	| 'setTitle'
	| 'setBio'
	| 'setAvatar'
	| 'setLocation'
	| 'setEmail'
	| 'setWebsite'
	| 'updateSlogan'
	| 'addSlogan'
	| 'removeSlogan'
	| 'updateSkill'
	| 'updateTechnology'
	| 'addSkill'
	| 'removeSkill'
	| 'addTechnology'
	| 'removeTechnology'
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
	name,
	title,
	bio,
	avatar,
	location,
	email,
	website,
	skills,
	slogans,
	setName,
	setTitle,
	setBio,
	setAvatar,
	setLocation,
	setEmail,
	setWebsite,
	updateSlogan,
	addSlogan,
	removeSlogan,
	updateSkill,
	updateTechnology,
	addSkill,
	removeSkill,
	addTechnology,
	removeTechnology,
}: AboutSettingsProps) {
	return (
		<>
			<Card className="shadow-2xs">
				<CardHeader>
					<CardTitle className="text-lg">About Hero</CardTitle>
					<CardDescription>配置 About 页面顶部的导语与在线状态</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<FieldLabel className="text-xs">主标语 (Headline)</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={aboutHeadline}
								onChange={(event) => setAboutHeadline(event.target.value)}
								placeholder="Full-Stack Engineer & Designer"
							/>
						</InputGroup>
					</div>
					<div>
						<FieldLabel className="text-xs">副标语 (Subheadline)</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={aboutSubheadline}
								onChange={(event) => setAboutSubheadline(event.target.value)}
								placeholder="Building delightful web experiences..."
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
								onChange={(event) => setAboutStatusText(event.target.value)}
								placeholder="Available for interesting projects"
							/>
						</InputGroup>
					</div>
				</CardContent>
			</Card>

			<Card className="shadow-2xs">
				<CardHeader>
					<CardTitle className="text-lg">基础站点资料</CardTitle>
					<CardDescription>
						统一编辑首页、About 和 Footer 使用的个人资料
					</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{[
						['站点名称', name, setName],
						['站点标题', title, setTitle],
						['头像 URL', avatar, setAvatar],
						['所在位置', location, setLocation],
						['联系邮箱', email, setEmail],
						['个人网站', website, setWebsite],
					].map(([label, value, setter]) => (
						<div key={label as string}>
							<FieldLabel className="text-xs">{label as string}</FieldLabel>
							<InputGroup>
								<InputGroupInput
									value={value as string}
									onChange={(event) =>
										(setter as (value: string) => void)(event.target.value)
									}
								/>
							</InputGroup>
						</div>
					))}
					<div className="md:col-span-2">
						<FieldLabel className="text-xs">站点简介</FieldLabel>
						<Textarea
							value={bio}
							onChange={(event) => setBio(event.target.value)}
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="shadow-2xs">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-lg">首页 Slogans</CardTitle>
						<CardDescription>管理首页视差区域展示的品牌口号</CardDescription>
					</div>
					<Button type="button" size="sm" variant="outline" onClick={addSlogan}>
						<Plus /> 添加 Slogan
					</Button>
				</CardHeader>
				<CardContent className="space-y-3">
					{slogans.map((slogan, index) => (
						<div
							key={slogan.id}
							className="grid grid-cols-1 md:grid-cols-[1fr_10rem_10rem_auto] gap-2 items-end"
						>
							<InputGroup>
								<InputGroupInput
									value={slogan.text}
									onChange={(event) =>
										updateSlogan(index, 'text', event.target.value)
									}
									placeholder="口号文本"
								/>
							</InputGroup>
							<InputGroup>
								<InputGroupInput
									value={slogan.fontSize ?? ''}
									onChange={(event) =>
										updateSlogan(index, 'fontSize', event.target.value)
									}
									placeholder="如 text-3xl"
								/>
							</InputGroup>
							<InputGroup>
								<InputGroupInput
									value={slogan.color ?? ''}
									onChange={(event) =>
										updateSlogan(index, 'color', event.target.value)
									}
									placeholder="如 #000000"
								/>
							</InputGroup>
							<Button
								type="button"
								variant="destructive"
								size="icon"
								onClick={() => removeSlogan(index)}
							>
								<Trash2 />
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<Card className="shadow-2xs">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-lg">Skills</CardTitle>
						<CardDescription>管理技能类别、技术栈和熟练度</CardDescription>
					</div>
					<Button type="button" size="sm" variant="outline" onClick={addSkill}>
						<Plus /> 添加类别
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					{skills.map((skill, skillIndex) => (
						<div
							key={skill.id}
							className="rounded-xl border bg-muted/20 p-4 space-y-3"
						>
							<div className="flex gap-2">
								<InputGroup>
									<InputGroupInput
										value={skill.category}
										onChange={(event) =>
											updateSkill(skillIndex, 'category', event.target.value)
										}
										placeholder="技能类别"
									/>
								</InputGroup>
								<Button
									type="button"
									variant="destructive"
									onClick={() => removeSkill(skillIndex)}
								>
									删除类别
								</Button>
							</div>
							{skill.technologies.map((technology, technologyIndex) => (
								<div
									key={technology.id}
									className="grid grid-cols-1 md:grid-cols-[1fr_10rem_auto] gap-2"
								>
									<InputGroup>
										<InputGroupInput
											value={technology.name}
											onChange={(event) =>
												updateTechnology(
													skillIndex,
													technologyIndex,
													'name',
													event.target.value,
												)
											}
											placeholder="技术名称"
										/>
									</InputGroup>
									<Select
										value={technology.level ?? ''}
										onValueChange={(value) =>
											updateTechnology(
												skillIndex,
												technologyIndex,
												'level',
												value,
											)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="熟练度" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="beginner">初级</SelectItem>
											<SelectItem value="intermediate">中级</SelectItem>
											<SelectItem value="advanced">高级</SelectItem>
											<SelectItem value="expert">专家</SelectItem>
										</SelectContent>
									</Select>
									<Button
										type="button"
										variant="destructive"
										size="icon"
										onClick={() =>
											removeTechnology(skillIndex, technologyIndex)
										}
									>
										<Trash2 />
									</Button>
								</div>
							))}
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => addTechnology(skillIndex)}
							>
								<Plus /> 添加技术
							</Button>
						</div>
					))}
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
