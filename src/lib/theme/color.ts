/** Converts supported CSS colors to Tailwind arbitrary HSL text color classes. */
export function convertToTailwindColor(
	color: string | null | undefined,
): string {
	if (!color || typeof color !== 'string') return 'foreground'

	color = color.trim()
	if (color.startsWith('[hsl(') && color.endsWith(')]')) return color
	if (color === 'foreground') return color

	try {
		let hsl: { h: number; s: number; l: number }
		if (color.startsWith('#')) hsl = hexToHsl(color)
		else if (color.startsWith('hsl(') || color.startsWith('hsla('))
			hsl = parseHsl(color)
		else if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
			const rgb = parseRgb(color)
			hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
		} else return 'foreground'

		return `[hsl(${Math.round(hsl.h)},${Math.round(hsl.s)}%,${Math.round(hsl.l)}%)]`
	} catch {
		return 'foreground'
	}
}

export default convertToTailwindColor

function hexToHsl(hex: string): { h: number; s: number; l: number } {
	hex = hex.replace('#', '')
	if (hex.length === 3)
		hex = hex
			.split('')
			.map((c) => c + c)
			.join('')
	if (hex.length !== 6) throw new Error('Invalid hex color')

	const r = parseInt(hex.slice(0, 2), 16) / 255
	const g = parseInt(hex.slice(2, 4), 16) / 255
	const b = parseInt(hex.slice(4, 6), 16) / 255
	return rgbToHsl(r, g, b)
}

function parseHsl(hsl: string): { h: number; s: number; l: number } {
	const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
	if (!match) throw new Error('Invalid HSL color')
	return {
		h: parseInt(match[1], 10),
		s: parseInt(match[2], 10),
		l: parseInt(match[3], 10),
	}
}

function parseRgb(rgb: string): { r: number; g: number; b: number } {
	const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
	if (!match) throw new Error('Invalid RGB color')
	return {
		r: parseInt(match[1], 10),
		g: parseInt(match[2], 10),
		b: parseInt(match[3], 10),
	}
}

function rgbToHsl(
	r: number,
	g: number,
	b: number,
): { h: number; s: number; l: number } {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	const l = (max + min) / 2
	let h: number
	let s: number

	if (max === min) {
		h = 0
		s = 0
	} else {
		const d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			case b:
				h = (r - g) / d + 4
				break
			default:
				h = 0
		}
		h /= 6
	}

	return { h: h * 360, s: s * 100, l: l * 100 }
}
