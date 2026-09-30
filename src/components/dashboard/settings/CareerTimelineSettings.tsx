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

import type { TimelineItem } from '@/types/site'

interface CareerTimelineSettingsProps {
	careerTimeline: TimelineItem[]
	setCareerTimeline: (value: TimelineItem[]) => void
	addCareerItem: () => void
}

export function CareerTimelineSettings({
	careerTimeline,
	setCareerTimeline,
	addCareerItem,
}: CareerTimelineSettingsProps) {
	return (
		<Card className="shadow-2xs">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="text-lg">
						职业经历时间线 (Career Timeline)
					</CardTitle>
					<CardDescription>管理关于页面的工作经历与重要里程碑</CardDescription>
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
	)
}
