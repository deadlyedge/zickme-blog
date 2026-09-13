'use client'

import { Button } from '@/components/ui/button'

export default function GalleryError({ reset }: { reset: () => void }) {
	return (
		<div className="container mx-auto p-6">
			<div className="rounded-lg border p-8 text-center">
				<h1 className="font-semibold">Gallery 管理加载失败</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					请检查数据库连接和管理员权限。
				</p>
				<Button className="mt-4" onClick={reset}>
					重试
				</Button>
			</div>
		</div>
	)
}
