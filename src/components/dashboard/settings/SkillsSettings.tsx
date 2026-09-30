import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import type { Skill } from '@/types/site'

interface SkillsSettingsProps {
	skills: Skill[]
	updateSkill: (index: number, field: 'category', value: string) => void
	updateTechnology: (
		skillIndex: number,
		technologyIndex: number,
		field: 'name' | 'level',
		value: string,
	) => void
	addSkill: () => void
	removeSkill: (index: number) => void
	addTechnology: (skillIndex: number) => void
	removeTechnology: (skillIndex: number, technologyIndex: number) => void
}

export function SkillsSettings({
	skills,
	updateSkill,
	updateTechnology,
	addSkill,
	removeSkill,
	addTechnology,
	removeTechnology,
}: SkillsSettingsProps) {
	return (
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
									onClick={() => removeTechnology(skillIndex, technologyIndex)}
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
	)
}
