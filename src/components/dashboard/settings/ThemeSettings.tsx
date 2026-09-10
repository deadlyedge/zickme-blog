import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { THEME_PRESETS } from '@/lib/theme'
import type { SettingsTabsProps } from './types'

type ThemeSettingsProps = Pick<
	SettingsTabsProps,
	'themePreset' | 'customCss' | 'setCustomCss' | 'handleApplyPreset'
>

export function ThemeSettings({
	themePreset,
	customCss,
	setCustomCss,
	handleApplyPreset,
}: ThemeSettingsProps) {
	return (
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
							<button
								key={preset.id}
								type="button"
								aria-pressed={isSelected}
								onClick={() => handleApplyPreset(preset.id)}
								className={`w-full p-4 rounded-xl border-2 text-left cursor-pointer transition-all space-y-3 ${
									isSelected
										? 'border-primary bg-primary/5 shadow-xs'
										: 'border-border/60 hover:border-primary/40 bg-card'
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-bold text-sm">{preset.name}</span>
									{isSelected && (
										<Badge className="text-[10px] px-1.5 py-0">当前激活</Badge>
									)}
								</div>
								<div className="flex items-center gap-2">
									<div
										className="size-5 rounded-full border shadow-2xs"
										style={{
											backgroundColor: preset.config.light?.primary || '#000',
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
							</button>
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
	)
}
