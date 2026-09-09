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
import type { SettingsTabsProps } from './types'

const SOCIAL_PLATFORMS = [
	'GitHub',
	'LinkedIn',
	'Twitter',
	'Instagram',
	'YouTube',
	'Facebook',
	'Bilibili',
	'Zhihu',
	'Other',
] as const
type SocialSettingsProps = Pick<
	SettingsTabsProps,
	'socialLinks' | 'updateSocialLink' | 'addSocialLink' | 'removeSocialLink'
>

export function SocialSettings({
	socialLinks,
	updateSocialLink,
	addSocialLink,
	removeSocialLink,
}: SocialSettingsProps) {
	return (
		<Card className="shadow-2xs">
			<CardHeader className="flex flex-row items-start justify-between gap-4">
				<div>
					<CardTitle className="text-lg">Social Networks</CardTitle>
					<CardDescription>
						管理 About 页面和首页 Footer 中展示的社交网络链接
					</CardDescription>
				</div>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={addSocialLink}
					className="gap-1"
				>
					<Plus className="h-3.5 w-3.5" />
					添加链接
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{socialLinks.length === 0 && (
					<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
						暂未配置社交网络，点击“添加链接”开始配置。
					</p>
				)}
				{socialLinks.map((link) => (
					<div
						key={link.id}
						className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[12rem_1fr_12rem_auto] md:items-end"
					>
						<div className="space-y-1">
							<FieldLabel className="text-xs">平台</FieldLabel>
							<Select
								value={link.platform}
								onValueChange={(value) =>
									updateSocialLink(link.id, 'platform', value)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="选择平台" />
								</SelectTrigger>
								<SelectContent>
									{SOCIAL_PLATFORMS.map((platform) => (
										<SelectItem key={platform} value={platform}>
											{platform}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<FieldLabel className="text-xs">链接 URL</FieldLabel>
							<InputGroup>
								<InputGroupInput
									type="url"
									value={link.url}
									onChange={(event) =>
										updateSocialLink(link.id, 'url', event.target.value)
									}
									placeholder="https://github.com/username"
								/>
							</InputGroup>
						</div>
						<div className="space-y-1">
							<FieldLabel className="text-xs">用户名（可选）</FieldLabel>
							<InputGroup>
								<InputGroupInput
									value={link.username ?? ''}
									onChange={(event) =>
										updateSocialLink(link.id, 'username', event.target.value)
									}
									placeholder="username"
								/>
							</InputGroup>
						</div>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							onClick={() => removeSocialLink(link.id)}
							aria-label={`删除 ${link.platform} 链接`}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				))}
			</CardContent>
		</Card>
	)
}
