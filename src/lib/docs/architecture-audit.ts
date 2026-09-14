export type DocumentationAuditInput = {
	name: string
	content: string
}

export type DocumentationAuditResult = {
	valid: boolean
	issues: string[]
}

const FORBIDDEN_CURRENT_COMMANDS = [
	/bun run sync(?:\s|`|$)/,
	/bun run sync:pull/,
	/bun run sync:galleries/,
	/bun run gallery:pull/,
]

const REQUIRED_MARKERS = [
	['publish entry', /publish.*正式|正式.*publish/i],
	['Git-first source', /Git.*唯一.*内容源|唯一.*人工内容源/],
	['migration audit', /db:audit-migrations/],
] as const

export function auditCurrentDocumentation(
	files: DocumentationAuditInput[],
): DocumentationAuditResult {
	const issues: string[] = []
	for (const file of files) {
		for (const pattern of FORBIDDEN_CURRENT_COMMANDS) {
			if (pattern.test(file.content))
				issues.push(`${file.name} 包含已废弃的正式命令语义：${pattern}`)
		}
	}
	const combinedContent = files.map((file) => file.content).join('\n')
	for (const [label, pattern] of REQUIRED_MARKERS)
		if (!pattern.test(combinedContent))
			issues.push(`当前入口文档集合缺少治理标记：${label}`)
	return { valid: issues.length === 0, issues }
}
