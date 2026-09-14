export type MigrationJournalEntry = {
	idx: number
	tag: string
}

export type MigrationAuditInput = {
	files: string[]
	journal: MigrationJournalEntry[]
}

export type MigrationAuditResult = {
	valid: boolean
	issues: string[]
	fileTags: string[]
	journalTags: string[]
}

const MIGRATION_FILE_PATTERN = /^(\d{4}_.+)\.sql$/

function migrationTagFromFile(file: string): string | null {
	const match = file.match(MIGRATION_FILE_PATTERN)
	return match?.[1] ?? null
}

export function auditMigrationChain(
	input: MigrationAuditInput,
): MigrationAuditResult {
	const fileTags = input.files
		.map(migrationTagFromFile)
		.filter((tag): tag is string => tag !== null)
		.sort()
	const journalEntries = [...input.journal].sort((a, b) => a.idx - b.idx)
	const journalTags = journalEntries.map((entry) => entry.tag)
	const issues: string[] = []

	if (fileTags.length === 0) issues.push('未发现正式 migration SQL 文件。')
	if (journalEntries.length === 0)
		issues.push('journal 未包含 migration entry。')

	const duplicate = (values: string[]) =>
		values.filter((value, index) => values.indexOf(value) !== index)
	for (const tag of duplicate(fileTags))
		issues.push(`migration 文件存在重复 tag：${tag}`)
	for (const tag of duplicate(journalTags))
		issues.push(`journal 存在重复 tag：${tag}`)

	const fileSet = new Set(fileTags)
	const journalSet = new Set(journalTags)
	for (const tag of fileTags)
		if (!journalSet.has(tag))
			issues.push(`migration 文件未记录在 journal：${tag}`)
	for (const tag of journalTags)
		if (!fileSet.has(tag)) issues.push(`journal 记录缺少 SQL 文件：${tag}`)

	const expectedIndexes = journalEntries.map((_entry, index) => index)
	const actualIndexes = journalEntries.map((entry) => entry.idx)
	if (actualIndexes.some((idx, index) => idx !== expectedIndexes[index]))
		issues.push('journal idx 不是从 0 开始的连续序列。')

	return {
		valid: issues.length === 0,
		issues,
		fileTags,
		journalTags,
	}
}
