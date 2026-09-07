'use client'

import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty'

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error('App runtime error:', error)
	}, [error])

	return (
		<div className="flex min-h-[70vh] items-center justify-center p-4">
			<Empty className="border-border/40">
				<EmptyHeader>
					<EmptyMedia variant="icon" className="text-destructive">
						<AlertTriangle className="size-8" />
					</EmptyMedia>
					<EmptyTitle>出现了一些问题</EmptyTitle>
					<EmptyDescription>
						{error.message || '加载页面时发生意外错误，请稍后重试。'}
					</EmptyDescription>
					<div className="mt-4 flex flex-wrap items-center justify-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => reset()}
							className="gap-1.5"
						>
							<RefreshCw className="size-4" />
							重新尝试
						</Button>
						<Button size="sm" asChild className="gap-1.5">
							<Link href="/">
								<Home className="size-4" />
								返回首页
							</Link>
						</Button>
					</div>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
