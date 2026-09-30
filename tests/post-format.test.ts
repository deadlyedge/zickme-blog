import { describe, expect, test } from 'bun:test'
import {
	calculateReadingTime,
	formatPublishedDate,
} from '../src/lib/posts/format'

describe('Post formatting helpers', () => {
	test('formats valid dates and preserves invalid date input', () => {
		expect(formatPublishedDate('2024-01-02')).toBe('January 2, 2024')
		expect(formatPublishedDate('not-a-date')).toBe('not-a-date')
	})

	test('calculates mixed Chinese and English reading length', () => {
		expect(calculateReadingTime('你好 world ```ts\nconst x = 1\n```')).toEqual({
			minutes: 1,
			text: '1 min',
			wordsCount: 3,
		})
	})

	test('uses one minute and zero words for empty content', () => {
		expect(calculateReadingTime(null)).toEqual({
			minutes: 1,
			text: '1 min',
			wordsCount: 0,
		})
	})
})
