import { describe, expect, test } from 'bun:test'
import { auditMigrationChain } from '../src/lib/db/migration-audit'

describe('migration chain audit', () => {
	test('accepts a matching SQL file chain and journal', () => {
		const result = auditMigrationChain({
			files: ['0000_baseline.sql', '0001_add_gallery.sql'],
			journal: [
				{ idx: 0, tag: '0000_baseline' },
				{ idx: 1, tag: '0001_add_gallery' },
			],
		})

		expect(result.valid).toBe(true)
		expect(result.issues).toEqual([])
	})

	test('reports missing files, journal entries, duplicates, and gaps', () => {
		const result = auditMigrationChain({
			files: ['0000_baseline.sql', '0000_duplicate.sql'],
			journal: [
				{ idx: 1, tag: '0000_baseline' },
				{ idx: 3, tag: '0002_missing_file' },
				{ idx: 3, tag: '0002_missing_file' },
			],
		})

		expect(result.valid).toBe(false)
		expect(result.issues).toContain(
			'migration 文件未记录在 journal：0000_duplicate',
		)
		expect(result.issues).toContain(
			'journal 记录缺少 SQL 文件：0002_missing_file',
		)
		expect(result.issues).toContain('journal 存在重复 tag：0002_missing_file')
		expect(result.issues).toContain('journal idx 不是从 0 开始的连续序列。')
	})
})
