import { spawnSync } from 'node:child_process'

export function runBunScript(args: string[], label: string): boolean {
	console.log(`\n▶ ${label}`)
	const result = spawnSync(process.execPath, args, {
		cwd: process.cwd(),
		stdio: 'inherit',
	})
	if (result.status !== 0) {
		console.error(`❌ ${label} 失败`)
		return false
	}
	return true
}

export function runGitCheck(): boolean {
	console.log('\n▶ git diff --check')
	const result = spawnSync('git', ['diff', '--check'], {
		cwd: process.cwd(),
		stdio: 'inherit',
	})
	return result.status === 0
}
