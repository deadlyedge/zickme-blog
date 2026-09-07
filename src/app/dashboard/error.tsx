'use client'

import { AlertTriangle, Home } from 'lucide-react'
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

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		console.error('Dashboard runtime error:', error)
	}, [error])

	return (
		<div className="flex min-h-[60vh] items-center justify-center p-6">
			<Empty className="border-border/40">
				<EmptyHeader>
					<EmptyMedia variant="icon" className="text-destructive">
						<AlertTriangle className="size-8" />
					</EmptyMedia>
					<EmptyTitle>后台页面加载失败</EmptyTitle>
					<EmptyDescription>
						{error.message || '管理控制台发生异常，可能是权限或网络连接问题。'}
					</EmptyDescription>
					<div className="mt-4 flex items-center justify-center gap-3">
						<Button variant="outline" size="sm" onClick={() => reset()}>
							重试
						</Button>
						<Button size="sm" asChild>
							<Link href="/dashboard">
								<Home className="size-4 mr-1.5" />
								控制台概览
							</Link>
						</Button>
					</div>
				</EmptyHeader>
			</Empty>
		</div>
	)
}
