'use client'

import { format } from 'date-fns'
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Database,
	Download,
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
	exportPostsZipAction,
	getRemotePostDiffAction,
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
	const [diffItems, setDiffItems] = useState<
		Array<{ slug: string; status: string }>
	>([])
	const [loadingDiff, setLoadingDiff] = useState(false)

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

	const handleExportPosts = async () => {
		startTransition(async () => {
			const result = await exportPostsZipAction()
			if (!result.success || !result.base64) {
				toast.error(result.error || '导出文章失败')
				return
			}
			const bytes = Uint8Array.from(atob(result.base64), (char) =>
				char.charCodeAt(0),
			)
			const url = URL.createObjectURL(
				new Blob([bytes], { type: 'application/zip' }),
			)
			const anchor = document.createElement('a')
			anchor.href = url
			anchor.download = result.fileName
			anchor.click()
			URL.revokeObjectURL(url)
			toast.success('数据库文章 ZIP 已下载')
		})
	}

	const handleDiffCheck = async () => {
		setLoadingDiff(true)
		try {
			const result = await getRemotePostDiffAction()
			if (result.success) {
				setDiffItems(result.posts)
				toast.success(`差异扫描完成，共 ${result.posts.length} 项`)
			} else {
				toast.error(result.error || '差异扫描失败')
			}
		} finally {
			setLoadingDiff(false)
		}
	}

	// 触发文件上传与导入
	const handleUploadImport = async () => {
		if (selectedFiles.length === 0) {
			toast.error('请先选择要上传的文件')
			return
		}

		startTransition(async () => {
			try {
				const formData = new FormData()
				for (const file of selectedFiles) {
					formData.append('files', file)
				}

				toast.info('正在处理上传文件并导入...')
				const result = await importUploadedContent(formData)
				setCurrentResult(result)

				if (result.success) {
					toast.success(`成功导入 ${result.successCount} 篇文章！`)
					setSelectedFiles([])
					if (fileInputRef.current) fileInputRef.current.value = ''
				} else {
					toast.error('导入处理失败，请查看日志详情')
				}
			} catch (err) {
				console.error(err)
				toast.error('上传导入请求异常')
			}
		})
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setSelectedFiles(Array.from(e.target.files))
		}
	}

	// 过滤当前展示的日志
	const logsToDisplay = selectedHistory
		? (selectedHistory.logs as SyncLogItem[])
		: currentResult?.logs || []

	const displayedLogs = logsToDisplay.filter((item) => {
		if (stageFilter === 'ALL') return true
		return item.stage === stageFilter
	})

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-7xl">
			{/* 顶栏 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<HardDriveUpload className="h-6 w-6 text-primary" />
						可视化内容同步与导入中心
					</h1>
					<p className="text-sm text-muted-foreground">
						多阶段日志追踪：Markdown解析 ➡️ Cloudinary图片规范 ➡️ 数据库落库
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Link href="/dashboard/posts">
						<Button variant="outline" size="sm" className="shadow-2xs">
							<FileText className="h-4 w-4 mr-1.5" />
							管理文章看板
						</Button>
					</Link>
				</div>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={(val) =>
					setActiveTab(val as 'sync' | 'upload' | 'history')
				}
				className="space-y-6"
			>
				<TabsList className="grid w-full grid-cols-3 max-w-md shadow-2xs">
					<TabsTrigger
						value="sync"
						className="flex items-center gap-2 text-xs sm:text-sm"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						本地扫描同步
					</TabsTrigger>
					<TabsTrigger
						value="upload"
						className="flex items-center gap-2 text-xs sm:text-sm"
					>
						<Upload className="h-3.5 w-3.5" />
						Web文件导入
					</TabsTrigger>
					<TabsTrigger
						value="history"
						className="flex items-center gap-2 text-xs sm:text-sm"
					>
						<Clock className="h-3.5 w-3.5" />
						历史记录
					</TabsTrigger>
				</TabsList>

				{/* 选项卡 1：本地扫描同步 */}
				<TabsContent value="sync" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-base">双向内容工具</CardTitle>
							<CardDescription>
								检查本地与数据库文章差异，或下载数据库文章备份。网页端不会直接覆盖本地工作区。
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									onClick={handleDiffCheck}
									disabled={loadingDiff || isPending}
								>
									{loadingDiff ? (
										<Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
									) : (
										<RefreshCw className="h-4 w-4 mr-1.5" />
									)}
									检查双向差异
								</Button>
								<Button
									variant="outline"
									onClick={handleExportPosts}
									disabled={isPending}
								>
									<Download className="h-4 w-4 mr-1.5" />
									导出数据库文章 ZIP
								</Button>
							</div>
							{diffItems.length > 0 && (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
									{(
										[
											'LOCAL_ONLY',
											'REMOTE_ONLY',
											'CONFLICT',
											'IN_SYNC',
										] as const
									).map((status) => (
										<div
											key={status}
											className="rounded-md border bg-muted/20 p-3"
										>
											<div className="font-semibold">{status}</div>
											<div className="text-muted-foreground">
												{
													diffItems.filter((item) => item.status === status)
														.length
												}{' '}
												项
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-base">扫描本地文件并入库</CardTitle>
							<CardDescription>
								将直接扫描项目目录 `content/posts/` 下所有的 Markdown
								文件并上传相关图片至 Cloudinary。
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
									<div className="space-y-0.5">
										<Label className="text-sm font-semibold">
											模拟运行 (Dry Run)
										</Label>
										<p className="text-xs text-muted-foreground">
											仅解析校验 Frontmatter 与关联图片，不写入数据库
										</p>
									</div>
									<Switch
										checked={dryRun}
										onCheckedChange={setDryRun}
										disabled={isPending}
									/>
								</div>

								<div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
									<div className="space-y-0.5">
										<Label className="text-sm font-semibold">
											清理归档 (Delete/Archive Missing)
										</Label>
										<p className="text-xs text-muted-foreground">
											自动将本地已删除的文章在数据库中标记为已归档
										</p>
									</div>
									<Switch
										checked={deleteOld}
										onCheckedChange={setDeleteOld}
										disabled={isPending}
									/>
								</div>
							</div>

							<div className="flex items-center justify-end">
								<Button
									size="lg"
									onClick={handleManualSync}
									disabled={isPending}
									className="gap-2 shadow-xs"
								>
									{isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											同步处理中...
										</>
									) : (
										<>
											<Play className="h-4 w-4 fill-current" />
											{dryRun ? '开始模拟预览' : '执行全量同步'}
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 选项卡 2：Web 上传导入 */}
				<TabsContent value="upload" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<CardTitle className="text-base">
								上传 Markdown / Zip 导入
							</CardTitle>
							<CardDescription>
								支持直接上传单个/多个 `.md` 文章文件，或包含文章与 `images/`
								资源的 `.zip` 压缩包。
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<button
								type="button"
								className="w-full border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-8 text-center bg-muted/10 cursor-pointer transition-colors"
								onClick={() => fileInputRef.current?.click()}
							>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileChange}
									multiple
									accept=".md,.markdown,.zip"
									className="hidden"
								/>
								<div className="flex flex-col items-center justify-center space-y-3">
									<div className="p-3 bg-primary/10 text-primary rounded-full">
										<Upload className="h-6 w-6" />
									</div>
									<div>
										<p className="text-sm font-medium">
											点击选择或拖拽 Markdown 文件 / Zip 压缩包至此处
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											支持 .md, .markdown, .zip 格式
										</p>
									</div>
								</div>
							</button>

							{selectedFiles.length > 0 && (
								<div className="space-y-2">
									<Label className="text-xs font-semibold text-muted-foreground">
										已选中的文件 ({selectedFiles.length})
									</Label>
									<div className="p-3 bg-muted/30 border rounded-lg space-y-1 max-h-40 overflow-y-auto">
										{selectedFiles.map((f) => (
											<div
												key={`${f.name}-${f.lastModified}-${f.size}`}
												className="text-xs font-mono flex items-center justify-between text-foreground/80"
											>
												<span>{f.name}</span>
												<span className="text-muted-foreground">
													{(f.size / 1024).toFixed(1)} KB
												</span>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex items-center justify-end gap-3">
								{selectedFiles.length > 0 && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setSelectedFiles([])
											if (fileInputRef.current) fileInputRef.current.value = ''
										}}
									>
										清空选择
									</Button>
								)}
								<Button
									size="lg"
									onClick={handleUploadImport}
									disabled={isPending || selectedFiles.length === 0}
									className="gap-2 shadow-xs"
								>
									{isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											正在解析并上传...
										</>
									) : (
										<>
											<HardDriveUpload className="h-4 w-4" />
											开始导入
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 选项卡 3：历史同步记录 */}
				<TabsContent value="history" className="space-y-6">
					<Card className="shadow-2xs">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle className="text-base">历史同步审计记录</CardTitle>
									<CardDescription>
										展示最近 30 次同步任务的触发类型、状态与日志概览
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={loadHistory}
									disabled={loadingHistory}
									className="shadow-2xs"
								>
									<RefreshCw
										className={`h-4 w-4 mr-1.5 ${loadingHistory ? 'animate-spin' : ''}`}
									/>
									刷新记录
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{loadingHistory ? (
								<div className="flex items-center justify-center p-12 text-muted-foreground">
									<Loader2 className="h-6 w-6 animate-spin mr-2" />
									正在加载历史记录...
								</div>
							) : historyLogs.length === 0 ? (
								<div className="text-center p-12 text-muted-foreground text-sm">
									暂无历史同步记录
								</div>
							) : (
								<div className="divide-y">
									{historyLogs.map((log) => {
										const isSelected = selectedHistory?.id === log.id
										return (
											<div
												key={log.id}
												className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
													isSelected ? 'bg-primary/5' : 'hover:bg-muted/20'
												}`}
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<Badge
															variant={
																log.status === 'SUCCESS'
																	? 'default'
																	: log.status === 'PARTIAL'
																		? 'secondary'
																		: 'destructive'
															}
														>
															{log.status}
														</Badge>
														<Badge variant="outline" className="text-xs">
															{log.triggerType}
														</Badge>
														<span className="text-xs text-muted-foreground font-mono">
															{log.createdAt
																? format(
																		new Date(log.createdAt),
																		'yyyy-MM-dd HH:mm:ss',
																	)
																: ''}
														</span>
													</div>
													<div className="text-xs text-muted-foreground">
														文章总数: {log.totalPosts || 0} | 成功:{' '}
														<span className="text-green-600 font-medium">
															{log.successCount || 0}
														</span>{' '}
														| 失败:{' '}
														<span className="text-destructive font-medium">
															{log.errorCount || 0}
														</span>
													</div>
												</div>

												<Button
													size="sm"
													variant={isSelected ? 'default' : 'outline'}
													onClick={() => {
														setSelectedHistory(isSelected ? null : log)
														setCurrentResult(null)
													}}
													className="self-end sm:self-auto text-xs"
												>
													{isSelected ? '收起日志' : '查看日志'}
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

			{/* 实时/选中的多阶段日志面板 */}
			{(currentResult || selectedHistory) && (
				<Card className="shadow-2xs overflow-hidden border-primary/20">
					<CardHeader className="p-4 border-b bg-muted/40">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div>
								<CardTitle className="text-base flex items-center gap-2">
									<Layers className="h-5 w-5 text-primary" />
									{selectedHistory
										? `历史日志详情 (${selectedHistory.triggerType})`
										: '本次同步执行日志'}
								</CardTitle>
								<CardDescription className="mt-1">
									阶段 1: Markdown解析校验 ➡️ 阶段 2: 图片处理与Cloudinary上传 ➡️
									阶段 3: 数据库落库
								</CardDescription>
							</div>

							{/* 阶段筛选 */}
							<div className="flex items-center gap-1.5 flex-wrap">
								<Button
									size="sm"
									variant={stageFilter === 'ALL' ? 'default' : 'outline'}
									onClick={() => setStageFilter('ALL')}
									className="h-7 text-xs"
								>
									全部
								</Button>
								<Button
									size="sm"
									variant={
										stageFilter === 'frontmatter' ? 'default' : 'outline'
									}
									onClick={() => setStageFilter('frontmatter')}
									className="h-7 text-xs"
								>
									Frontmatter
								</Button>
								<Button
									size="sm"
									variant={stageFilter === 'media' ? 'default' : 'outline'}
									onClick={() => setStageFilter('media')}
									className="h-7 text-xs"
								>
									图片/CDN
								</Button>
								<Button
									size="sm"
									variant={stageFilter === 'db' ? 'default' : 'outline'}
									onClick={() => setStageFilter('db')}
									className="h-7 text-xs"
								>
									数据库
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-96 p-4 bg-muted/20">
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
												className="flex items-start gap-3 p-2.5 rounded-lg bg-background border hover:bg-muted/40 transition-colors shadow-2xs"
											>
												<div className="mt-0.5">
													<LevelIcon className={`h-4 w-4 ${levelConf.color}`} />
												</div>
												<div className="flex-1 space-y-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
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
														<span className="text-[10px] text-muted-foreground ml-auto font-mono">
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
	)
}
