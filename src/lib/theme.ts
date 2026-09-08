import type { ThemeConfig, ThemeVariables } from '@/types'

// 将 ThemeVariables 对象转为 CSS 样式字符串
export function variablesToCss(vars?: ThemeVariables): string {
	if (!vars) return ''
	const entries = Object.entries(vars).filter(
		([_, val]) => typeof val === 'string' && val.trim() !== '',
	)
	if (entries.length === 0) return ''

	return entries
		.map(([key, val]) => {
			// 如果 key 已经包含 -- 则直接用，否则加上 --
			const cssVarName = key.startsWith('--')
				? key
				: `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
			return `${cssVarName}: ${val};`
		})
		.join(' ')
}

export function generateDynamicThemeCss(
	themeConfig?: ThemeConfig | null,
): string {
	if (!themeConfig) return ''

	const lightCss = variablesToCss(themeConfig.light)
	const darkCss = variablesToCss(themeConfig.dark)
	const customCss = themeConfig.customCss?.trim() || ''

	// 如果没有任何自定义配置，返回空字符串，完全由 globals.css 默认值接管
	if (!lightCss && !darkCss && !customCss) {
		return ''
	}

	let result = ''

	if (lightCss) {
		result += `:root { ${lightCss} }\n`
	}

	if (darkCss) {
		result += `.dark { ${darkCss} }\n`
	}

	if (customCss) {
		result += `${customCss}\n`
	}

	return result.trim()
}

// 预设主题配置
export interface ThemePresetOption {
	id: 'default' | 'minimal-slate' | 'cyber-green' | 'warm-amber'
	name: string
	description: string
	badgeColor: string
	config: ThemeConfig
}

export const THEME_PRESETS: ThemePresetOption[] = [
	{
		id: 'default',
		name: 'Default Forest',
		description: '经典自然的墨绿与温润米白基调',
		badgeColor: 'bg-emerald-500',
		config: {
			preset: 'default',
			light: {
				'--primary': 'oklch(0.5234 0.1347 144.1672)',
				'--background': 'oklch(0.9711 0.0074 80.7211)',
				'--foreground': 'oklch(0.3 0.0358 30.2042)',
				'--card': 'oklch(0.9711 0.0074 80.7211)',
				'--radius': '0.5rem',
			},
			dark: {
				'--primary': 'oklch(0.6731 0.1624 144.2083)',
				'--background': 'oklch(0.18 0.02 144)',
				'--foreground': 'oklch(0.95 0.01 144)',
				'--card': 'oklch(0.22 0.025 144)',
				'--radius': '0.5rem',
			},
		},
	},
	{
		id: 'minimal-slate',
		name: 'Minimal Slate',
		description: '极简冷色调灰阶，注重内容纯粹与排版力量',
		badgeColor: 'bg-slate-500',
		config: {
			preset: 'minimal-slate',
			light: {
				'--primary': 'oklch(0.35 0.03 260)',
				'--background': 'oklch(0.99 0.002 260)',
				'--foreground': 'oklch(0.15 0.02 260)',
				'--card': 'oklch(0.97 0.005 260)',
				'--radius': '0.375rem',
			},
			dark: {
				'--primary': 'oklch(0.85 0.03 260)',
				'--background': 'oklch(0.12 0.01 260)',
				'--foreground': 'oklch(0.92 0.01 260)',
				'--card': 'oklch(0.16 0.015 260)',
				'--radius': '0.375rem',
			},
		},
	},
	{
		id: 'cyber-green',
		name: 'Cyber Neon',
		description: '高反差赛博极光绿，极具极客与未来科技感',
		badgeColor: 'bg-teal-400',
		config: {
			preset: 'cyber-green',
			light: {
				'--primary': 'oklch(0.55 0.18 165)',
				'--background': 'oklch(0.98 0.005 165)',
				'--foreground': 'oklch(0.2 0.04 165)',
				'--card': 'oklch(0.95 0.01 165)',
				'--radius': '0.75rem',
			},
			dark: {
				'--primary': 'oklch(0.78 0.22 165)',
				'--background': 'oklch(0.1 0.02 165)',
				'--foreground': 'oklch(0.96 0.02 165)',
				'--card': 'oklch(0.15 0.03 165)',
				'--radius': '0.75rem',
			},
		},
	},
	{
		id: 'warm-amber',
		name: 'Warm Amber',
		description: '温暖复古琥珀与夕阳暖色，阅读舒适柔和',
		badgeColor: 'bg-amber-500',
		config: {
			preset: 'warm-amber',
			light: {
				'--primary': 'oklch(0.58 0.17 65)',
				'--background': 'oklch(0.98 0.01 75)',
				'--foreground': 'oklch(0.25 0.05 60)',
				'--card': 'oklch(0.95 0.02 75)',
				'--radius': '0.625rem',
			},
			dark: {
				'--primary': 'oklch(0.72 0.19 65)',
				'--background': 'oklch(0.14 0.025 60)',
				'--foreground': 'oklch(0.94 0.02 70)',
				'--card': 'oklch(0.18 0.03 60)',
				'--radius': '0.625rem',
			},
		},
	},
]
