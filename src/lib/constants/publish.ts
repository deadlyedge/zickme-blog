export const PUBLISH_SCOPES = ['posts', 'galleries', 'all'] as const

export const PUBLISH_STATUSES = [
	'QUEUED',
	'RUNNING',
	'SUCCEEDED',
	'PARTIAL_SUCCESS',
	'FAILED',
	'CANCELLED',
] as const
