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

import type { FeaturedProject } from '@/types/site'

interface FeaturedProjectsSettingsProps {
	featuredProjects: FeaturedProject[]
	setFeaturedProjects: (value: FeaturedProject[]) => void
	addFeaturedProject: () => void
}

export function FeaturedProjectsSettings({
	featuredProjects,
	setFeaturedProjects,
	addFeaturedProject,
}: FeaturedProjectsSettingsProps) {
	return (
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
	)
}
