'use client'

export default function SnapshotsError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<div className="container mx-auto max-w-3xl p-6 py-16 text-center">
			<h2 className="text-xl font-semibold">快照页面加载失败</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				{error.message || '请稍后重试。'}
			</p>
			<button
				type="button"
				onClick={reset}
				className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
			>
				重新加载
			</button>
		</div>
	)
}
