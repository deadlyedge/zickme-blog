import { createHash } from 'node:crypto'

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortValue)
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.filter(([, item]) => item !== undefined)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, item]) => [key, sortValue(item)]),
		)
	}
	return value
}

export function normalizeSyncValue(value: unknown): string {
	return JSON.stringify(sortValue(value))
}

export function syncContentHash(value: unknown): string {
	return createHash('sha256').update(normalizeSyncValue(value)).digest('hex')
}
