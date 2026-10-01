import { describe, expect, test } from 'bun:test'
import {
	actionFailure,
	actionSuccess,
	unwrapActionResult,
} from '../src/lib/actions/action-result'

describe('ActionResult helpers', () => {
	test('wraps successful data and unwraps it', () => {
		const result = actionSuccess({ id: 'user-1' })

		expect(result).toEqual({ ok: true, data: { id: 'user-1' } })
		expect(unwrapActionResult(result)).toEqual({ id: 'user-1' })
	})

	test('preserves failure messages and throws when unwrapped', () => {
		const result = actionFailure('操作失败')

		expect(result).toEqual({ ok: false, error: '操作失败' })
		expect(() => unwrapActionResult(result)).toThrow('操作失败')
	})
})
