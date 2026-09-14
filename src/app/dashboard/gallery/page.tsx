'use client'

import { RefreshCw, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { galleries, galleryImages } from '@/db/schema'
import {
	getDashboardGalleries,
	markGalleryImageForDeletion,
	updateGallery,
} from '@/lib/actions/gallery-admin'

type Gallery = typeof galleries.$inferSelect & {
	images: (typeof galleryImages.$inferSelect)[]
}

export default function DashboardGalleryPage() {
	const [items, setItems] = useState<Gallery[]>([])
	const [loading, setLoading] = useState(true)
	const [pending, startTransition] = useTransition()
	const load = useCallback(async () => {
		setLoading(true)
		const result = await getDashboardGalleries()
		if ('success' in result && result.success === false)
			toast.error(result.error)
		else setItems(result as Gallery[])
		setLoading(false)
	}, [])
	useEffect(() => {
		load()
	}, [load])

	const save = (gallery: Gallery, form: HTMLFormElement) => {
		const data = new FormData(form)
		startTransition(async () => {
			const result = await updateGallery({
				id: gallery.id,
				title: String(data.get('title') ?? ''),
				description: String(data.get('description') ?? '') || null,
				cover: gallery.cover,
				status: String(data.get('status') ?? 'DRAFT'),
				tags:
					typeof gallery.metadata === 'object' &&
					gallery.metadata &&
					'tags' in gallery.metadata &&
					Array.isArray(gallery.metadata.tags)
						? gallery.metadata.tags
						: [],
				location:
					typeof gallery.metadata === 'object' &&
					gallery.metadata &&
					'location' in gallery.metadata &&
					typeof gallery.metadata.location === 'string'
						? gallery.metadata.location
						: '',
				showExif:
					typeof gallery.metadata === 'object' &&
					gallery.metadata &&
					'showExif' in gallery.metadata &&
					gallery.metadata.showExif === true,
				showLocation:
					typeof gallery.metadata === 'object' &&
					gallery.metadata &&
					'showLocation' in gallery.metadata &&
					gallery.metadata.showLocation === true,
			})
			if (result.success) {
				toast.success('相册已保存')
				load()
			} else toast.error(result.error)
		})
	}

	return (
		<div className="container mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Gallery 管理</h1>
					<p className="text-sm text-muted-foreground">
						仅编辑 album.yaml 对应的人工字段；gallery.yaml 始终由索引命令生成。
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={load} disabled={loading}>
					<RefreshCw className={loading ? 'animate-spin' : ''} />
					刷新
				</Button>
			</div>
			{!loading && items.length === 0 && (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						暂无相册。先运行 <code> bun run sync:galleries -- --dry-run</code>。
					</CardContent>
				</Card>
			)}
			{items.map((gallery) => (
				<Card key={gallery.id}>
					<CardHeader>
						<CardTitle className="flex items-center justify-between gap-3">
							<span>{gallery.title}</span>
							<Badge
								variant={
									gallery.syncStatus === 'CONFLICT' ? 'destructive' : 'outline'
								}
							>
								{gallery.syncStatus}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={(event) => {
								event.preventDefault()
								save(gallery, event.currentTarget)
							}}
							className="space-y-4"
						>
							<Input
								name="title"
								defaultValue={gallery.title}
								aria-label="相册标题"
							/>
							<Textarea
								name="description"
								defaultValue={gallery.description ?? ''}
								aria-label="相册描述"
							/>
							<select
								name="status"
								defaultValue={gallery.status}
								className="h-9 rounded-md border bg-transparent px-3 text-sm"
							>
								<option value="DRAFT">草稿</option>
								<option value="PUBLISHED">发布</option>
								<option value="ARCHIVED">归档</option>
							</select>
							<div className="flex items-center justify-between gap-3">
								<span className="text-xs text-muted-foreground">
									{gallery.images.length} 张图片
								</span>
								<Button type="submit" disabled={pending}>
									<Save />
									保存
								</Button>
							</div>
						</form>
						<div className="mt-5 space-y-2 border-t pt-4">
							<h2 className="text-sm font-semibold">图片</h2>
							{gallery.images.map((image) => (
								<div
									key={image.id}
									className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
								>
									<span className="truncate">
										{image.sourcePath.split('/').pop()}{' '}
										{image.syncStatus === 'PENDING_DELETE' && (
											<Badge variant="destructive">待删除</Badge>
										)}
									</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											startTransition(async () => {
												const result = await markGalleryImageForDeletion(
													image.id,
												)
												if (result.success) {
													toast.success('已标记待删除')
													load()
												} else {
													toast.error(result.error)
												}
											})
										}
									>
										<Trash2 />
										标记删除
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	)
}
