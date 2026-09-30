import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { FieldLabel } from '@/components/ui/field'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'

interface AboutHeroSettingsProps {
	headline: string
	subheadline: string
	statusText: string
	onHeadlineChange: (value: string) => void
	onSubheadlineChange: (value: string) => void
	onStatusTextChange: (value: string) => void
}

export function AboutHeroSettings({
	headline,
	subheadline,
	statusText,
	onHeadlineChange,
	onSubheadlineChange,
	onStatusTextChange,
}: AboutHeroSettingsProps) {
	return (
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
							value={headline}
							onChange={(event) => onHeadlineChange(event.target.value)}
							placeholder="Full-Stack Engineer & Designer"
						/>
					</InputGroup>
				</div>
				<div>
					<FieldLabel className="text-xs">副标语 (Subheadline)</FieldLabel>
					<InputGroup>
						<InputGroupInput
							value={subheadline}
							onChange={(event) => onSubheadlineChange(event.target.value)}
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
							value={statusText}
							onChange={(event) => onStatusTextChange(event.target.value)}
							placeholder="Available for interesting projects"
						/>
					</InputGroup>
				</div>
			</CardContent>
		</Card>
	)
}
