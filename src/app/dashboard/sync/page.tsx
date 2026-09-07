'use client'

import { format } from 'date-fns'
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Database,
	FileCode,
	FileText,
	HardDriveUpload,
	ImageIcon,
	Info,
	Layers,
	Loader2,
	Play,
	RefreshCw,
	Upload,
	XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	getSyncHistoryLogs,
	importUploadedContent,
	triggerManualSync,
} from '@/lib/actions/posts-admin'
import type { SyncLog, SyncLogItem, SyncResult } from '@/types'

const STAGE_ICON_MAP = {
	frontmatter: FileCode,
	media: ImageIcon,
	db: Database,
	general: Layers,
}

const LEVEL_STYLE_MAP = {
	info: {
		badge: 'secondary',
		icon: Info,
		color: 'text-blue-500',
	},
	success: {
		badge: 'default',
		icon: CheckCircle2,
		color: 'text-green-500',
	},
	warn: {
		badge: 'outline',
		icon: AlertCircle,
		color: 'text-amber-500',
	},
	error: {
		badge: 'destructive',
		icon: XCircle,
		color: 'text-destructive',
	},
}

export default function DashboardSyncPage() {
	const [activeTab, setActiveTab] = useState<'sync' | 'upload' | 'history'>(
		'sync',
	)
	const [isPending, startTransition] = useTransition()

	// 扫描同步选项
	const [dryRun, setDryRun] = useState(false)
	const [deleteOld, setDeleteOld] = useState(true)

	// 当前执行结果与实时日志
	const [currentResult, setCurrentResult] = useState<SyncResult | null>(null)
	const [stageFilter, setStageFilter] = useState<string>('ALL')

	// 历史日志
	const [historyLogs, setHistoryLogs] = useState<SyncLog[]>([])
	const [loadingHistory, setLoadingHistory] = useState(false)
	const [selectedHistory, setSelectedHistory] = useState<SyncLog | null>(null)

	// 文件上传状态
	const [selectedFiles, setSelectedFiles] = useState<File[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	const loadHistory = useCallback(async () => {
		try {
			setLoadingHistory(true)
			const logs = await getSyncHistoryLogs(30)
			setHistoryLogs(logs)
		} catch (err) {
			console.error(err)
			toast.error('加载同步历史记录失败')
		} finally {
			setLoadingHistory(false)
		}
	}, [])

	useEffect(() => {
		if (activeTab === 'history') {
			loadHistory()
		}
	}, [activeTab, loadHistory])

	// 触发本地手动同步
	const handleManualSync = () => {
		startTransition(async () => {
			toast.info(dryRun ? '开始模拟预览同步...' : '正在执行内容扫描同步...')
			const result = await triggerManualSync({ dryRun, deleteOld })
			setCurrentResult(result)
			if (result.success) {
				toast.success(
					dryRun
						? '预览检查完成！'
						: `同步完成：成功 ${result.successCount} 篇，失败 ${result.errorCount} 篇`,
				)
			} else {
				toast.error('同步过程中发生错误，请查看日志详情')
			}
		})
	}

	// 触发文件上传与导入
	const handleUploadImport = async () => {
		if (selectedFiles.length === 0) {
			toast.warning('请先选择需要导入的 Markdown 文件或 Zip 压缩包')
			return
		}

		startTransition(async () => {
			const formData = new FormData()
			for (const file of selectedFiles) {
				formData.append('files', file)
			}

			toast.info('正在解析并导入上传文件...')
			const result = await importUploadedContent(formData)
			setCurrentResult(result)
			if (result.success) {
				toast.success(
					`导入完成：成功 ${result.successCount} 篇，失败 ${result.errorCount} 篇`,
				)
				setSelectedFiles([])
				if (fileInputRef.current) fileInputRef.current.value = ''
			} else {
				toast.error('导入失败，请查看日志详情')
			}
		})
	}

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSelectedFiles(Array.from(e.target.files))
		}
	}

	const displayedLogs = (
		currentResult
			? currentResult.logs
			: selectedHistory
				? (selectedHistory.logs as SyncLogItem[])
				: []
	).filter((log) => stageFilter === 'ALL' || log.stage === stageFilter)

	return (
		<div className="h-svh overflow-y-auto">
			<div className="container mx-auto p-6 pt-24 space-y-6">
				{/* 顶栏 */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<Link href="/dashboard">
							<Button variant="outline" size="sm">
								<ArrowLeft className="h-4 w-4 mr-2" />
								返回概览
							</Button>
						</Link>
						<div>
							<h1 className="text-2xl font-bold flex items-center gap-2">
								<HardDriveUpload className="h-6 w-6 text-primary" />
								可视化内容同步与导入中心
							</h1>
							<p className="text-sm text-muted-foreground">
								多阶段日志追踪：Markdown解析 ➡️ Cloudinary图片规范 ➡️ 数据库落库
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Link href="/dashboard/posts">
							<Button variant="outline" size="sm">
								<FileText className="h-4 w-4 mr-2" />
								管理文章看板
							</Button>
						</Link>
					</div>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={(val) => setActiveTab(val as any)}
					className="space-y-6"
				>
					<TabsList className="grid w-full grid-cols-3 max-w-md">
						<TabsTrigger value="sync" className="flex items-center gap-2">
							<RefreshCw className="h-4 w-4" />
							本地扫描同步
						</TabsTrigger>
						<TabsTrigger value="upload" className="flex items-center gap-2">
							<Upload className="h-4 w-4" />
							Web文件导入
						</TabsTrigger>
						<TabsTrigger value="history" className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							历史同步记录
						</TabsTrigger>
					</TabsList>

					{/* 选项卡 1：本地扫描同步 */}
					<TabsContent value="sync" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">扫描本地文件并入库</CardTitle>
								<CardDescription>
									将直接扫描项目目录 `content/posts/` 下所有的 Markdown
									文件并上传相关图片至 Cloudinary。
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex flex-wrap items-center gap-8 p-4 bg-muted/40 rounded-lg border">
									<div className="flex items-center space-x-2">
										<Switch
											id="dry-run-switch"
											checked={dryRun}
											onCheckedChange={setDryRun}
										/>
										<Label htmlFor="dry-run-switch" className="cursor-pointer">
											<span className="font-medium">
												预览模拟模式 (Dry-run)
											</span>
											<p className="text-xs text-muted-foreground">
												仅校验 Frontmatter 及图片，不实际修改数据库
											</p>
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Switch
											id="delete-old-switch"
											checked={deleteOld}
											onCheckedChange={setDeleteOld}
											disabled={dryRun}
										/>
										<Label
											htmlFor="delete-old-switch"
											className="cursor-pointer"
										>
											<span className="font-medium">自动归档已删除文件</span>
											<p className="text-xs text-muted-foreground">
												若本地已不存在该文章，自动将其标记为 ARCHIVED
											</p>
										</Label>
									</div>
								</div>

								<div className="flex items-center justify-between">
									<Button
										onClick={handleManualSync}
										disabled={isPending}
										size="lg"
										className="font-semibold"
									>
										{isPending ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												正在同步中...
											</>
										) : (
											<>
												<Play className="h-4 w-4 mr-2" />
												立即扫描并同步
											</>
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* 选项卡 2：Web 网页端直接导入 */}
					<TabsContent value="upload" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									直接上传 Markdown 文件或 ZIP 压缩包
								</CardTitle>
								<CardDescription>
									无需通过 Git 提交，即可通过网页端快速上传 .md 文件或附带
									images 文件夹的 .zip 压缩包。
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/30 cursor-pointer transition-colors space-y-3"
								>
									<Upload className="h-10 w-10 mx-auto text-muted-foreground" />
									<div className="font-medium text-foreground">
										点击选择文件或将文件拖曳至此
									</div>
									<p className="text-xs text-muted-foreground">
										支持多选 .md 文件，或直接打包上传 .zip
										压缩包（包含文章与图片文件夹）
									</p>
									<input
										ref={fileInputRef}
										type="file"
										multiple
										accept=".md,.zip,image/*"
										className="hidden"
										onChange={handleFileSelect}
									/>
								</div>

								{selectedFiles.length > 0 && (
									<div className="space-y-2">
										<div className="text-xs font-semibold text-muted-foreground">
											已选待导入文件 ({selectedFiles.length}):
										</div>
										<div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-muted/40 rounded border">
											{selectedFiles.map((file) => (
												<Badge
													key={`${file.name}-${file.size}-${file.lastModified}`}
													variant="outline"
													className="flex items-center gap-1 text-xs"
												>
													<FileText className="h-3 w-3" />
													{file.name}
													<span className="text-[10px] text-muted-foreground">
														({(file.size / 1024).toFixed(1)} KB)
													</span>
												</Badge>
											))}
										</div>
									</div>
								)}

								<Button
									onClick={handleUploadImport}
									disabled={isPending || selectedFiles.length === 0}
									size="lg"
									className="font-semibold"
								>
									{isPending ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											正在上传并解析...
										</>
									) : (
										<>
											<HardDriveUpload className="h-4 w-4 mr-2" />
											开始导入落库
										</>
									)}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					{/* 选项卡 3：历史同步记录 */}
					<TabsContent value="history" className="space-y-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">
										历史同步与导入日志
									</CardTitle>
									<CardDescription>
										查阅历次同步结果、变更文章统计与排错日志
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={loadHistory}
									disabled={loadingHistory}
								>
									<RefreshCw
										className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`}
									/>
									刷新
								</Button>
							</CardHeader>
							<CardContent>
								{loadingHistory ? (
									<div className="text-center py-8">
										<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
									</div>
								) : historyLogs.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground text-sm">
										暂无历史同步日志记录
									</div>
								) : (
									<div className="space-y-3">
										{historyLogs.map((log) => {
											const isSuccess = log.status === 'SUCCESS'
											const isPartial = log.status === 'PARTIAL'
											const isSelected = selectedHistory?.id === log.id

											return (
												<div
													key={log.id}
													onClick={() => {
														setSelectedHistory(log)
														setCurrentResult(null)
													}}
													className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
														isSelected
															? 'bg-primary/5 border-primary'
															: 'hover:bg-muted/40'
													}`}
												>
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<Badge
																variant={
																	isSuccess
																		? 'default'
																		: isPartial
																			? 'outline'
																			: 'destructive'
																}
															>
																{log.status}
															</Badge>
															<span className="font-medium text-sm">
																触发方式: {log.triggerType}
															</span>
															<span className="text-xs text-muted-foreground">
																{format(
																	new Date(log.createdAt),
																	'yyyy-MM-dd HH:mm:ss',
																)}
															</span>
														</div>
														<div className="text-xs text-muted-foreground">
															总文章: {log.totalPosts} | 成功:{' '}
															{log.successCount} | 失败: {log.errorCount}
														</div>
													</div>
													<Button variant="ghost" size="sm">
														查看详情日志
													</Button>
												</div>
											)
										})}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* 多阶段实时/选定日志监控看板 */}
				{(currentResult || selectedHistory) && (
					<Card className="border-t-4 border-t-primary">
						<CardHeader className="pb-3">
							<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
								<div>
									<CardTitle className="text-base flex items-center gap-2">
										<Layers className="h-5 w-5 text-primary" />
										多阶段同步诊断与日志监控
										{currentResult && (
											<Badge
												variant={
													currentResult.status === 'SUCCESS'
														? 'default'
														: currentResult.status === 'PARTIAL'
															? 'outline'
															: 'destructive'
												}
											>
												{currentResult.status}
											</Badge>
										)}
										{selectedHistory && (
											<Badge variant="outline">
												历史记录: {selectedHistory.id.slice(0, 8)}
											</Badge>
										)}
									</CardTitle>
									<CardDescription className="mt-1">
										阶段 1: Markdown解析校验 ➡️ 阶段 2: 图片处理与Cloudinary上传
										➡️ 阶段 3: 数据库落库
									</CardDescription>
								</div>

								{/* 阶段筛选 */}
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant={stageFilter === 'ALL' ? 'default' : 'outline'}
										onClick={() => setStageFilter('ALL')}
									>
										全部阶段
									</Button>
									<Button
										size="sm"
										variant={
											stageFilter === 'frontmatter' ? 'default' : 'outline'
										}
										onClick={() => setStageFilter('frontmatter')}
									>
										Frontmatter
									</Button>
									<Button
										size="sm"
										variant={stageFilter === 'media' ? 'default' : 'outline'}
										onClick={() => setStageFilter('media')}
									>
										图片/CDN
									</Button>
									<Button
										size="sm"
										variant={stageFilter === 'db' ? 'default' : 'outline'}
										onClick={() => setStageFilter('db')}
									>
										数据库
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<ScrollArea className="h-100 p-4 bg-muted/20">
								{displayedLogs.length === 0 ? (
									<div className="text-center py-12 text-muted-foreground text-sm">
										该阶段无相关日志
									</div>
								) : (
									<div className="space-y-2 font-mono text-xs">
										{displayedLogs.map((item, index) => {
											const levelConf =
												LEVEL_STYLE_MAP[item.level] || LEVEL_STYLE_MAP.info
											const StageIcon =
												STAGE_ICON_MAP[item.stage] || STAGE_ICON_MAP.general
											const LevelIcon = levelConf.icon
											const logKey = `${item.stage}-${item.timestamp}-${item.message.slice(0, 20)}-${index}`

											return (
												<div
													key={logKey}
													className="flex items-start gap-3 p-2.5 rounded bg-background border hover:bg-muted/40 transition-colors"
												>
													<div className="mt-0.5">
														<LevelIcon
															className={`h-4 w-4 ${levelConf.color}`}
														/>
													</div>
													<div className="flex-1 space-y-1">
														<div className="flex items-center gap-2">
															<Badge
																variant="outline"
																className="text-[10px] px-1.5 py-0 flex items-center gap-1"
															>
																<StageIcon className="h-3 w-3" />
																{item.stage.toUpperCase()}
															</Badge>
															<span className="font-semibold text-foreground">
																{item.message}
															</span>
															<span className="text-[10px] text-muted-foreground ml-auto">
																{item.timestamp
																	? format(
																			new Date(item.timestamp),
																			'HH:mm:ss.SSS',
																		)
																	: ''}
															</span>
														</div>
														{item.detail && (
															<div className="text-[11px] text-muted-foreground bg-muted/60 p-2 rounded whitespace-pre-wrap break-all">
																{item.detail}
															</div>
														)}
													</div>
												</div>
											)
										})}
									</div>
								)}
							</ScrollArea>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
