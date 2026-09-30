/** Structured result returned by user-facing Server Actions. */
export type ActionResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string }
