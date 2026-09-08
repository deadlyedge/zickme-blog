'use client'

import { Clock, FileText, List } from 'lucide-react'
import { marked } from 'marked'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CommentsSection } from '@/components/comments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { usePost } from '@/lib/hooks/useContent'
import { calculateReadingTime, cn, formatPublishedDate } from '@/lib/utils'
import type { PostWithTags } from '@/types'

// Configure marked options for standard GFM rendering
marked.setOptions({
	gfm: true,
	breaks: true,
})

interface TocItem {
	id: string
	text: string
	level: number
}

interface PostClientProps {
	initialPost?: PostWithTags
}

export function PostClient({ initialPost }: PostClientProps) {
	const params = useParams()
	const slug = params.slug as string
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const articleContentRef = useRef<HTMLDivElement>(null)

	// 阅读进度
	const [readingProgress, setReadingProgress] = useState(0)
	// 活跃目录项
	const [activeHeadingId, setActiveHeadingId] = useState<string>('')
	// 目录列表
	const [tocItems, setTocItems] = useState<TocItem[]>([])

	// Use TanStack Query with initial data hydration
	const { data: post, isLoading } = usePost(slug, {
		initialData: initialPost,
		staleTime: 5 * 60 * 1000, // 5 minutes
	})

	// 估算阅读时长
	const readingTime = useMemo(() => {
		return calculateReadingTime(post?.content)
	}, [post?.content])

	// 解析 Markdown HTML
	const renderedHtml = useMemo(() => {
		if (!post?.content) return ''
		try {
			return marked.parse(post.content) as string
		} catch (err) {
			console.error('Error parsing markdown:', err)
			return post.content
		}
	}, [post?.content])

	// 提取目录（从 HTML 标题中生成带 ID 的结构）
	useEffect(() => {
		if (!renderedHtml || !articleContentRef.current) return

		const container = articleContentRef.current
		const headings = container.querySelectorAll('h1, h2, h3, h4')
		const items: TocItem[] = []

		headings.forEach((heading, index) => {
			const text = heading.textContent || ''
			let id = heading.id
			if (!id) {
				id = `heading-${index}-${text
					.toLowerCase()
					.replace(/[^\w\u4e00-\u9fa5]+/g, '-')
					.replace(/^-+|-+$/g, '')}`
				heading.id = id
			}
			const level = Number.parseInt(heading.tagName.replace('H', ''), 10)
			items.push({ id, text, level })
		})

		setTocItems(items)
	}, [renderedHtml])

	// 滚动监听：计算阅读进度条与 TOC 高亮
	useEffect(() => {
		const container = scrollContainerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			const totalScrollable = scrollHeight - clientHeight
			if (totalScrollable > 0) {
				const progress = Math.min(
					100,
					Math.max(0, (scrollTop / totalScrollable) * 100),
				)
				setReadingProgress(progress)
			}

			// 更新目录高亮
			if (articleContentRef.current) {
				const headings = Array.from(
					articleContentRef.current.querySelectorAll('h1, h2, h3, h4'),
				)
				const containerTop = container.getBoundingClientRect().top

				let currentActiveId = ''
				for (const heading of headings) {
					const rect = heading.getBoundingClientRect()
					if (rect.top - containerTop <= 120) {
						currentActiveId = heading.id
					} else {
						break
					}
				}
				if (currentActiveId) {
					setActiveHeadingId(currentActiveId)
				} else if (headings.length > 0 && headings[0].id) {
					setActiveHeadingId(headings[0].id)
				}
			}
		}

		container.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()

		return () => {
			container.removeEventListener('scroll', handleScroll)
		}
	}, [])

	// 目录点击平滑滚动
	const handleScrollToHeading = (id: string) => {
		const element = document.getElementById(id)
		const container = scrollContainerRef.current
		if (element && container) {
			const containerRect = container.getBoundingClientRect()
			const elementRect = element.getBoundingClientRect()
			const targetScrollTop =
				container.scrollTop + (elementRect.top - containerRect.top) - 80

			container.scrollTo({
				top: targetScrollTop,
				behavior: 'smooth',
			})
			setActiveHeadingId(id)
		}
	}

	// 增强代码块：注入复制按钮与语言提示
	useEffect(() => {
		if (!renderedHtml || !articleContentRef.current) return

		const container = articleContentRef.current
		const preElements = container.querySelectorAll('pre')

		preElements.forEach((pre) => {
			if (pre.getAttribute('data-copy-enhanced')) return
			pre.setAttribute('data-copy-enhanced', 'true')
			pre.classList.add('relative', 'group')

			// 获取代码语言（如果存在）
			const codeElement = pre.querySelector('code')
			const classNames = codeElement?.className || ''
			const langMatch = classNames.match(/language-([a-zA-Z0-9_-]+)/)
			const language = langMatch ? langMatch[1] : ''

			// 顶栏工具条容器
			const toolbar = document.createElement('div')
			toolbar.className =
				'absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10'

			if (language) {
				const langBadge = document.createElement('span')
				langBadge.className =
					'text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300 select-none'
				langBadge.textContent = language
				toolbar.appendChild(langBadge)
			}

			const copyBtn = document.createElement('button')
			copyBtn.className =
				'p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all text-xs flex items-center gap-1 shadow-sm'
			copyBtn.setAttribute('title', '复制代码')
			copyBtn.innerHTML = `
				<svg class="size-3.5 copy-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
				<span class="copy-text hidden sm:inline text-[11px]">复制</span>
			`

			copyBtn.onclick = async (e) => {
				e.preventDefault()
				const codeText = codeElement?.textContent || pre.textContent || ''
				try {
					await navigator.clipboard.writeText(codeText)
					copyBtn.innerHTML = `
						<svg class="size-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
						<span class="copy-text text-emerald-400 hidden sm:inline text-[11px]">已复制</span>
					`
					setTimeout(() => {
						copyBtn.innerHTML = `
							<svg class="size-3.5 copy-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
							<span class="copy-text hidden sm:inline text-[11px]">复制</span>
						`
					}, 2000)
				} catch (err) {
					console.error('Failed to copy code:', err)
				}
			}

			toolbar.appendChild(copyBtn)
			pre.appendChild(toolbar)
		})
	}, [renderedHtml])

	if (isLoading) {
		return (
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto p-6 pt-24 max-w-4xl">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
						<div className="h-64 bg-gray-200 rounded mb-6" />
						<div className="flex gap-2 mb-4">
							<div className="h-6 bg-gray-200 rounded w-16" />
							<div className="h-6 bg-gray-200 rounded w-20" />
						</div>
						<div className="h-4 bg-gray-200 rounded w-32 mb-8" />
						<div className="space-y-4">
							<div className="h-4 bg-gray-200 rounded" />
							<div className="h-4 bg-gray-200 rounded w-5/6" />
							<div className="h-4 bg-gray-200 rounded w-4/6" />
							<div className="h-4 bg-gray-200 rounded w-3/6" />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!post) {
		return (
			<div className="pt-16 overflow-y-auto h-svh">
				<div className="mx-auto p-6 pt-24 max-w-4xl text-center">
					<h1 className="text-3xl font-semibold text-red-600 mb-4">
						文章未找到
					</h1>
					<p className="text-slate-600 mb-6">这篇文章可能已被删除或移动。</p>
					<Link
						href="/posts"
						className="text-sm text-amber-600 hover:underline"
					>
						返回文章列表
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div
			ref={scrollContainerRef}
			className="pt-16 overflow-y-auto h-svh relative"
		>
			{/* 顶部阅读进度指示器 (Reading Progress Bar) */}
			<div className="fixed top-0 left-0 right-0 h-1 bg-border/40 z-50 pointer-events-none">
				<div
					className="h-full bg-primary transition-all duration-150 ease-out shadow-xs"
					style={{ width: `${readingProgress}%` }}
				/>
			</div>

			<div className="mx-auto p-6 max-w-6xl">
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
					{/* 文章主体区域 */}
					<div className="lg:col-span-8 min-w-0">
						<article>
							<header className="mb-8">
								<h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
									{post.title}
								</h1>

								{post.poster && (
									<Image
										src={post.poster}
										alt={post.title}
										width={800}
										height={400}
										priority
										className="rounded-xl mb-6 object-cover h-auto w-full border border-border/40 shadow-md"
									/>
								)}

								<div className="flex flex-wrap items-center gap-2 mb-3">
									{post.tags?.map((tag) => (
										<Badge
											key={tag.slug}
											className="bg-secondary text-secondary-foreground"
											style={{
												backgroundColor: tag.color || undefined,
												color: tag.color ? '#fff' : undefined,
											}}
										>
											{tag.name}
										</Badge>
									))}
								</div>

								{/* 元信息：发布时间、阅读时长估算、字数 */}
								<div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1 border-t border-border/40">
									<time>
										发布于{' '}
										{formatPublishedDate(
											(post.publishedAt || post.createdAt).toISOString(),
										)}
									</time>
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3.5" />
										{readingTime.text}
									</span>
									<span className="inline-flex items-center gap-1">
										<FileText className="size-3.5" />约 {readingTime.wordsCount}{' '}
										字
									</span>
								</div>
							</header>

							{/* 移动端目录折叠卡片（仅当文章有大纲时渲染） */}
							{tocItems.length > 0 && (
								<div className="block lg:hidden mb-8 p-4 rounded-xl border bg-muted/20">
									<div className="flex items-center gap-2 font-medium text-sm mb-3">
										<List className="size-4 text-primary" />
										<span>目录导航</span>
									</div>
									<nav className="space-y-1.5 text-xs">
										{tocItems.map((item) => (
											<button
												key={`mobile-toc-${item.id}`}
												type="button"
												onClick={() => handleScrollToHeading(item.id)}
												className={cn(
													'block w-full text-left py-1 px-2 rounded transition-colors text-ellipsis overflow-hidden whitespace-nowrap',
													activeHeadingId === item.id
														? 'bg-primary/10 text-primary font-semibold'
														: 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
													item.level === 3 && 'pl-4',
													item.level >= 4 && 'pl-6',
												)}
											>
												{item.text}
											</button>
										))}
									</nav>
								</div>
							)}

							<div
								ref={articleContentRef}
								className="prose prose-lg prose-blog max-w-none dark:prose-invert"
							>
								{/** biome-ignore lint/security/noDangerouslySetInnerHtml: <rendered via marked> */}
								<div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
							</div>
						</article>

						<div className="mt-12 pt-8 border-t border-border/50">
							<CommentsSection docId={post.id} />
						</div>
					</div>

					{/* 桌面端侧边浮动目录（Sticky TOC） */}
					<aside className="hidden lg:block lg:col-span-4 sticky top-20 pl-4">
						<div className="p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-2xs space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-border/50">
								<div className="flex items-center gap-2 font-semibold text-sm">
									<List className="size-4 text-primary" />
									<span>文章目录</span>
								</div>
								<span className="text-[11px] text-muted-foreground font-mono">
									{readingTime.minutes} min read
								</span>
							</div>

							{tocItems.length === 0 ? (
								<p className="text-xs text-muted-foreground py-2">
									正文未包含各级标题。
								</p>
							) : (
								<nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
									{tocItems.map((item) => {
										const isActive = activeHeadingId === item.id
										return (
											<button
												key={`toc-${item.id}`}
												type="button"
												onClick={() => handleScrollToHeading(item.id)}
												className={cn(
													'block w-full text-left py-1.5 px-2 rounded-lg text-xs transition-all text-ellipsis overflow-hidden whitespace-nowrap leading-relaxed',
													isActive
														? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-2.5'
														: 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
													item.level === 3 && 'ml-2.5 pl-2',
													item.level >= 4 && 'ml-4 pl-2',
												)}
												title={item.text}
											>
												{item.text}
											</button>
										)
									})}
								</nav>
							)}

							<div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
								<span>进度：{Math.round(readingProgress)}%</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 text-xs px-2"
									onClick={() =>
										scrollContainerRef.current?.scrollTo({
											top: 0,
											behavior: 'smooth',
										})
									}
								>
									回到顶部
								</Button>
							</div>
						</div>
					</aside>
				</div>
			</div>
		</div>
	)
}
