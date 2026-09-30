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

interface SiteProfileSettingsProps {
	name: string
	title: string
	avatar: string
	location: string
	email: string
	website: string
	bio: string
	onNameChange: (value: string) => void
	onTitleChange: (value: string) => void
	onAvatarChange: (value: string) => void
	onLocationChange: (value: string) => void
	onEmailChange: (value: string) => void
	onWebsiteChange: (value: string) => void
	onBioChange: (value: string) => void
}

export function SiteProfileSettings({
	name,
	title,
	avatar,
	location,
	email,
	website,
	bio,
	onNameChange,
	onTitleChange,
	onAvatarChange,
	onLocationChange,
	onEmailChange,
	onWebsiteChange,
	onBioChange,
}: SiteProfileSettingsProps) {
	const fields = [
		['站点名称', name, onNameChange],
		['站点标题', title, onTitleChange],
		['头像 URL', avatar, onAvatarChange],
		['所在位置', location, onLocationChange],
		['联系邮箱', email, onEmailChange],
		['个人网站', website, onWebsiteChange],
	] as const

	return (
		<Card className="shadow-2xs">
			<CardHeader>
				<CardTitle className="text-lg">基础站点资料</CardTitle>
				<CardDescription>
					统一编辑首页、About 和 Footer 使用的个人资料
				</CardDescription>
			</CardHeader>
			<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{fields.map(([label, value, onChange]) => (
					<div key={label}>
						<FieldLabel className="text-xs">{label}</FieldLabel>
						<InputGroup>
							<InputGroupInput
								value={value}
								onChange={(event) => onChange(event.target.value)}
							/>
						</InputGroup>
					</div>
				))}
				<div className="md:col-span-2">
					<FieldLabel className="text-xs">站点简介</FieldLabel>
					<Textarea
						value={bio}
						onChange={(event) => onBioChange(event.target.value)}
						rows={3}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
