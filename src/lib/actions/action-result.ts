/** Structured result returned by every Server Action. */
export type ActionResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string }

/** Build a successful ActionResult. */
export function actionSuccess<T>(data: T): ActionResult<T> {
	return { ok: true, data }
}

/** Build a failed ActionResult without leaking unknown error values. */
export function actionFailure<T = never>(error: string): ActionResult<T> {
	return { ok: false, error }
}

/** Unwrap an ActionResult for query functions that use thrown errors for failures. */
export function unwrapActionResult<T>(result: ActionResult<T>): T {
	if (!result.ok) throw new Error(result.error)
	return result.data
}
