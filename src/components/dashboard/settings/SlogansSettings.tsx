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
import type { Slogan } from '@/types/site'

interface SlogansSettingsProps {
	slogans: Slogan[]
	updateSlogan: (index: number, field: keyof Slogan, value: string) => void
	addSlogan: () => void
	removeSlogan: (index: number) => void
}

export function SlogansSettings({
	slogans,
	updateSlogan,
	addSlogan,
	removeSlogan,
}: SlogansSettingsProps) {
	return (
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
	)
}
