import { runSync } from '@/lib/sync/sync-orchestrator'
import type { PublishTrigger } from '@/types/publish/publish'
import { type PublishSummary, publishSummaryFromSync } from './publish-summary'
import type { PublishScope, ValidationReport } from './publish-types'
import { validatePublishContent } from './publish-validation'

export type PublishWorkflowResult =
	| { kind: 'validation'; report: ValidationReport }
	| { kind: 'published'; report: ValidationReport; summary: PublishSummary }

/**
 * Publish is non-destructive by default. The legacy option is accepted only
 * for callers that still pass it, but source-missing cleanup belongs to a
 * separate, explicitly authorized ADMIN workflow.
 */
export function resolvePublishDeleteOld(_requested?: boolean): false {
	return false
}

export async function validateForPublish(
	scope: PublishScope,
): Promise<ValidationReport> {
	return validatePublishContent(scope)
}

export async function runPublishWorkflow(options: {
	scope: PublishScope
	dryRun: boolean
	deleteOld?: boolean
	triggeredBy?: PublishTrigger
	actorId?: string | null
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
		deleteOld: resolvePublishDeleteOld(options.deleteOld),
		triggeredBy: options.triggeredBy ?? 'CLI',
		actorId: options.actorId,
	})
	return { kind: 'published', report, summary: publishSummaryFromSync(summary) }
}
