import { describe, expect, test } from 'bun:test'
import { auditCurrentDocumentation } from '../src/lib/docs/architecture-audit'

const validContent = `
Git 是唯一人工内容源。
publish 是唯一正式内容发布入口。
bun run db:audit-migrations
`

describe('current documentation audit', () => {
	test('accepts current governance language', () => {
		const result = auditCurrentDocumentation([
			{ name: 'README.md', content: validContent },
		])
		expect(result.valid).toBe(true)
		expect(result.issues).toEqual([])
	})

	test('rejects legacy sync command guidance', () => {
		const result = auditCurrentDocumentation([
			{
				name: 'README.md',
				content: `${validContent}\nbun run sync -- --scope all`,
			},
		])
		expect(result.valid).toBe(false)
		expect(result.issues[0]).toContain('已废弃的正式命令语义')
	})
})
