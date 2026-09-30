import { describe, expect, test } from 'bun:test'
import { convertToTailwindColor } from '../src/lib/theme/color'

describe('Theme color formatting', () => {
	test('converts short hex and HSL colors to Tailwind HSL classes', () => {
		expect(convertToTailwindColor('#333')).toBe('[hsl(0,0%,20%)]')
		expect(convertToTailwindColor('hsl(120,50%,50%)')).toBe(
			'[hsl(120,50%,50%)]',
		)
	})

	test('preserves existing arbitrary HSL classes and falls back for invalid values', () => {
		expect(convertToTailwindColor('[hsl(12,34%,56%)]')).toBe(
			'[hsl(12,34%,56%)]',
		)
		expect(convertToTailwindColor('unsupported')).toBe('foreground')
		expect(convertToTailwindColor(null)).toBe('foreground')
	})
})
