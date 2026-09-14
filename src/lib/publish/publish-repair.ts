import { spawnSync } from 'node:child_process'
import * as path from 'node:path'
import type { ContentIssue } from './publish-types'

export type RepairResult = { ok: boolean; command: string; output: string }

function safeAlbum(value: string): string {
	if (!/^[a-zA-Z0-9_-]+$/.test(value))
		throw new Error('相册名称包含不允许的字符')
	return value
}

export function repairCommand(issue: ContentIssue): string[] | null {
	if (issue.code === 'FRONTMATTER_REBUILD_REQUIRED')
		return [
			'run',
			'scripts/check-content.ts',
			'--scope',
			'posts',
			'--fix',
			'--no-examples',
		]
	if (issue.code === 'ALBUM_REBUILD_REQUIRED') {
		return [
			'run',
			'scripts/check-content.ts',
			'--scope',
			'galleries',
			'--fix',
			'--no-examples',
		]
	}
	if (issue.code === 'MEDIA_PREPARATION_REQUIRED' && issue.mediaPath) {
		const album = path.basename(path.dirname(issue.mediaPath))
		return ['run', 'scripts/prepare-media.ts', '--album', safeAlbum(album)]
	}
	if (issue.code === 'GALLERY_INDEX_REQUIRED')
		return ['run', 'scripts/gallery-index.ts']
	return null
}

export function executeRepair(issue: ContentIssue): RepairResult {
	const args = repairCommand(issue)
	if (!args)
		return {
			ok: false,
			command: '',
			output: '该问题没有可自动执行的修复命令。',
		}
	const result = spawnSync(process.execPath, args, {
		cwd: process.cwd(),
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	return {
		ok: result.status === 0,
		command: `${process.execPath} ${args.join(' ')}`,
		output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
	}
}
