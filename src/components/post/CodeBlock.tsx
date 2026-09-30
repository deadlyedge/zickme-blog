'use client'

import { Check, Copy } from 'lucide-react'
import { useRef, useState } from 'react'

export function CodeBlock({ children }: React.ComponentProps<'pre'>) {
	const preRef = useRef<HTMLPreElement>(null)
	const [copied, setCopied] = useState(false)

	const codeClassName =
		children && typeof children === 'object' && 'props' in children
			? (children.props as { className?: string }).className
			: undefined
	const language = codeClassName?.match(/language-([a-zA-Z0-9_-]+)/)?.[1] ?? ''

	const handleCopy = async () => {
		const pre = preRef.current
		if (!pre) return

		try {
			await navigator.clipboard.writeText(
				pre.querySelector('code')?.textContent || pre.textContent || '',
			)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			console.error('Failed to copy code:', error)
		}
	}

	return (
		<pre ref={preRef} className="relative group">
			<div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
				{language && (
					<span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-600 select-none">
						{language}
					</span>
				)}
				<button
					type="button"
					title="复制代码"
					className="p-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-all text-xs flex items-center gap-1 shadow-sm"
					onClick={handleCopy}
				>
					{copied ? (
						<Check className="size-3.5 text-emerald-400" />
					) : (
						<Copy className="size-3.5" />
					)}
					<span
						className={`hidden sm:inline text-[11px] ${copied ? 'text-emerald-400' : ''}`}
					>
						{copied ? '已复制' : '复制'}
					</span>
				</button>
			</div>
			{children}
		</pre>
	)
}
