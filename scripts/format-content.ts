import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import matter from 'gray-matter'
import { parse, stringify } from 'yaml'

const write = process.argv.includes('--write')
const dryRun = process.argv.includes('--dry-run') || !write
const contentRoot = path.join(process.cwd(), 'content')

async function walk(root: string): Promise<string[]> {
	const files: string[] = []
	const entries = await fs
		.readdir(root, { withFileTypes: true })
		.catch(() => [])
	for (const entry of entries) {
		const filePath = path.join(root, entry.name)
		if (entry.isDirectory() && entry.name !== '.gallery-input')
			files.push(...(await walk(filePath)))
		else if (
			entry.isFile() &&
			(entry.name.endsWith('.md') || entry.name === 'album.yaml')
		)
			files.push(filePath)
	}
	return files
}

function formatMarkdown(source: string): string {
	const parsed = matter(source)
	if (!source.trimStart().startsWith('---')) return source
	const frontmatter = stringify(parsed.data, { lineWidth: 120 }).trimEnd()
	return `---\n${frontmatter}\n---${parsed.content}`
}

function formatYaml(source: string): string {
	const value = parse(source)
	return value && typeof value === 'object'
		? stringify(value, { lineWidth: 120 })
		: source
}

async function main() {
	const files = await walk(contentRoot)
	const changed: string[] = []
	for (const filePath of files) {
		const source = await fs.readFile(filePath, 'utf8')
		const next = filePath.endsWith('.md')
			? formatMarkdown(source)
			: formatYaml(source)
		if (next === source) continue
		changed.push(path.relative(process.cwd(), filePath))
		if (!dryRun) await fs.writeFile(filePath, next, 'utf8')
	}

	if (changed.length === 0) {
		console.log('✅ 内容格式已符合规范，无需修改。')
		return
	}
	console.log(`${dryRun ? '🔎 预览' : '✅ 已写入'} ${changed.length} 个文件：`)
	for (const file of changed) console.log(`   ${file}`)
	if (dryRun)
		console.log(
			'ℹ️ 默认不会修改文件；确认后使用 bun run content:format -- --write。',
		)
}

main().catch((error) => {
	console.error(
		'❌ 内容格式化失败:',
		error instanceof Error ? error.message : String(error),
	)
	process.exitCode = 1
})
