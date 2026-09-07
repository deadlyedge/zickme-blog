import type { ThemeConfig, ThemeVariables } from '@/types'

// 将 ThemeVariables 对象转为 CSS 样式字符串
function variablesToCss(vars?: ThemeVariables): string {
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
