import {
	BookOpen,
	type Code2,
	ExternalLink,
	FileText,
	Globe,
	PanelsTopLeft,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GitHubIcon, XTwitterIcon } from '@/components/ui/icons/social'
import {
	getPostLinks,
	isOutdatedWarningActive,
	normalizePostMetadata,
} from '@/lib/post-metadata'
import type { PostLinkType } from '@/types'

const linkPresentation: Record<
	PostLinkType,
	{ label: string; Icon: typeof Code2 | typeof GitHubIcon }
> = {
	github: { label: 'GitHub', Icon: GitHubIcon },
	twitter: { label: 'X / Twitter', Icon: XTwitterIcon },
	demo: { label: '在线 Demo', Icon: ExternalLink },
	documentation: { label: '文档/源码', Icon: BookOpen },
	figma: { label: 'Figma', Icon: PanelsTopLeft },
	paper: { label: 'Paper / PDF', Icon: FileText },
	website: { label: '网站', Icon: Globe },
	other: { label: '外部链接', Icon: ExternalLink },
}

interface PostLinksProps {
	metadata: unknown
	sourceUrl?: string | null
	compact?: boolean
}

export function PostLinks({
	metadata,
	sourceUrl,
	compact = false,
}: PostLinksProps) {
	const postMetadata = normalizePostMetadata(metadata)
	const links = getPostLinks(metadata, sourceUrl)
	const warning = postMetadata.outdatedWarning
	const warningIsDate = warning
		? !Number.isNaN(new Date(warning).getTime())
		: false
	const shouldShowWarning =
		warning && (!warningIsDate || isOutdatedWarningActive(warning))

	if (
		links.length === 0 &&
		!postMetadata.series &&
		!postMetadata.category &&
		!shouldShowWarning
	) {
		return null
	}

	return (
		<div className={compact ? 'space-y-2 my-2' : 'space-y-3 my-2'}>
			{links.length > 0 && (
				<nav
					aria-label="文章外部链接"
					className="flex flex-wrap items-baseline gap-x-4 gap-y-2"
				>
					{links.map((link) => {
						const presentation = linkPresentation[link.type]
						const Icon = presentation.Icon
						return (
							<a
								key={`${link.type}-${link.url}`}
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`${link.label ? `${link.label}：` : ''}${link.url}（在新窗口打开）`}
								title={link.url}
								className="group inline-flex w-fit max-w-full min-w-0 items-start gap-1.5 text-xs text-primary underline-offset-4 transition-colors hover:text-primary/70 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Icon
									className="mt-0.5 size-4 shrink-0"
									aria-label={presentation.label}
								/>
								<span className="min-w-0 break-all font-mono leading-5">
									{link.label && (
										<span className="mr-1.5 font-sans font-medium text-muted-foreground">
											{link.label}：
										</span>
									)}
									{link.url}
								</span>
								<ExternalLink
									className="mt-0.5 size-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
									aria-hidden="true"
								/>
							</a>
						)
					})}
				</nav>
			)}

			{(postMetadata.series || postMetadata.category) && (
				<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					{postMetadata.series && (
						<Badge variant="secondary">系列：{postMetadata.series}</Badge>
					)}
					{postMetadata.category && (
						<Badge variant="outline">分类：{postMetadata.category}</Badge>
					)}
				</div>
			)}

			{shouldShowWarning && (
				<p
					role="status"
					className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
				>
					⚠️{' '}
					{warningIsDate ? '本文内容可能已过时，请结合最新资料阅读。' : warning}
				</p>
			)}
		</div>
	)
}
