import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import type { SettingsTabsProps } from './types'

type LandingSettingsProps = Pick<
	SettingsTabsProps,
	| 'landingEnabled'
	| 'showTopHottest'
	| 'showSlogans'
	| 'showPinnedPosts'
	| 'showLatestPosts'
	| 'pinnedPostIds'
	| 'allPosts'
	| 'setLandingEnabled'
	| 'setShowTopHottest'
	| 'setShowSlogans'
	| 'setShowPinnedPosts'
	| 'setShowLatestPosts'
	| 'togglePinnedPost'
>

export function LandingSettings({
	landingEnabled,
	showTopHottest,
	showSlogans,
	showPinnedPosts,
	showLatestPosts,
	pinnedPostIds,
	allPosts,
	setLandingEnabled,
	setShowTopHottest,
	setShowSlogans,
	setShowPinnedPosts,
	setShowLatestPosts,
	togglePinnedPost,
}: LandingSettingsProps) {
	return (
		<Card className="shadow-2xs">
			<CardHeader>
				<CardTitle className="text-lg">首页分区块与开关编排</CardTitle>
				<CardDescription>
					按需开启或隐藏 Landing Page 各功能区块
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
						<div className="space-y-0.5">
							<FieldLabel className="text-sm font-bold">
								Landing Page 落地页总开关
							</FieldLabel>
							<p className="text-xs text-muted-foreground">
								若关闭，访问首页将直接重定向至文章列表
							</p>
						</div>
						<Switch
							checked={landingEnabled}
							onCheckedChange={setLandingEnabled}
						/>
					</div>

					<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
						<div className="space-y-0.5">
							<FieldLabel className="text-sm font-bold">
								TOP 5 热门文章 3D 翻页区
							</FieldLabel>
							<p className="text-xs text-muted-foreground">
								在首页置顶呈现全站热议文章轮播
							</p>
						</div>
						<Switch
							checked={showTopHottest}
							onCheckedChange={setShowTopHottest}
						/>
					</div>

					<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
						<div className="space-y-0.5">
							<FieldLabel className="text-sm font-bold">
								Slogan 视差口号区
							</FieldLabel>
							<p className="text-xs text-muted-foreground">
								展示多条视差滚动的品牌 Slogan
							</p>
						</div>
						<Switch checked={showSlogans} onCheckedChange={setShowSlogans} />
					</div>

					<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
						<div className="space-y-0.5">
							<FieldLabel className="text-sm font-bold">
								置顶精选文章区 (Pinned Posts)
							</FieldLabel>
							<p className="text-xs text-muted-foreground">
								在首页重点展示管理员勾选的置顶文章
							</p>
						</div>
						<Switch
							checked={showPinnedPosts}
							onCheckedChange={setShowPinnedPosts}
						/>
					</div>

					<div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-2xs">
						<div className="space-y-0.5">
							<FieldLabel className="text-sm font-bold">
								最新发布文章区 (Latest Posts)
							</FieldLabel>
							<p className="text-xs text-muted-foreground">
								展示近期最新发布的文章瀑布流
							</p>
						</div>
						<Switch
							checked={showLatestPosts}
							onCheckedChange={setShowLatestPosts}
						/>
					</div>
				</div>

				{/* 置顶文章选择器 */}
				<div className="pt-6 border-t space-y-3">
					<div className="flex items-center justify-between">
						<FieldLabel className="text-sm font-bold flex items-center gap-2">
							<Pin className="h-4 w-4 text-primary" />
							配置置顶文章 (已勾选: {pinnedPostIds.length} 篇)
						</FieldLabel>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-2 border rounded-xl bg-muted/10">
						{allPosts.map((post) => {
							const isPinned = pinnedPostIds.includes(post.id)
							return (
								<button
									key={post.id}
									type="button"
									aria-pressed={isPinned}
									onClick={() => togglePinnedPost(post.id)}
									className={`w-full p-3 rounded-lg border text-left cursor-pointer transition-all space-y-1 ${
										isPinned
											? 'border-primary bg-primary/10 shadow-xs'
											: 'border-border/60 hover:border-border bg-card'
									}`}
								>
									<div className="flex items-center justify-between">
										<Badge
											variant={isPinned ? 'default' : 'outline'}
											className="text-[10px] px-1.5 py-0"
										>
											{isPinned ? '已置顶' : '未置顶'}
										</Badge>
									</div>
									<div className="font-semibold text-xs line-clamp-1">
										{post.title}
									</div>
									<div className="text-[10px] text-muted-foreground line-clamp-1">
										/{post.slug}
									</div>
								</button>
							)
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
