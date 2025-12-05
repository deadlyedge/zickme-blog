import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { AppState } from './types'
import { createNavigationSlice } from './navigation-slice'
import { createContentSlice } from './content-slice'
import { createUISlice } from './ui-slice'
import { createAuthSlice } from './auth-slice'

export const useAppStore = create<AppState>()(
	devtools(
		(...a) => ({
			...createNavigationSlice(...a),
			...createContentSlice(...a),
			...createUISlice(...a),
			...createAuthSlice(...a),
		}),
		{ name: 'app-store' },
	),
)

export * from './types'
