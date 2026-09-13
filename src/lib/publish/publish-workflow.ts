import { runSync } from '@/lib/sync/sync-orchestrator'
import type { SyncRunSummary } from '@/lib/sync/sync-types'
import type { PublishScope, ValidationReport } from './publish-types'
import { validatePublishContent } from './publish-validation'

export type PublishWorkflowResult =
	| { kind: 'validation'; report: ValidationReport }
	| { kind: 'published'; report: ValidationReport; summary: SyncRunSummary }

export async function validateForPublish(
	scope: PublishScope,
): Promise<ValidationReport> {
	return validatePublishContent(scope)
}

export async function runPublishWorkflow(options: {
	scope: PublishScope
	dryRun: boolean
	deleteOld?: boolean
}): Promise<PublishWorkflowResult> {
	const report = await validateForPublish(options.scope)
	if (!report.valid) return { kind: 'validation', report }
	const scope =
		options.scope === 'posts'
			? 'POSTS'
			: options.scope === 'galleries'
				? 'GALLERIES'
				: 'ALL'
	const summary = await runSync({
		scope,
		dryRun: options.dryRun,
		deleteOld: options.deleteOld ?? true,
		triggeredBy: 'CLI',
	})
	return { kind: 'published', report, summary }
}
