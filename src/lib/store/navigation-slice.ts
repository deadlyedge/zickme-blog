import { StateCreator } from 'zustand'
import { AppState, NavigationActions, NavigationState } from './types'

export const createNavigationSlice: StateCreator<
	AppState,
	[],
	[],
	NavigationState & NavigationActions
> = (set, get) => ({
	isNavigating: false,
	currentPath: '/',
	navigationHistory: ['/'],

	setNavigating: (navigating) => set({ isNavigating: navigating }),
	setCurrentPath: (path) =>
		set((state) => ({
			currentPath: path,
			navigationHistory: [...state.navigationHistory.slice(-9), path],
		})),
	addToHistory: (path) =>
		set((state) => ({
			navigationHistory: [...state.navigationHistory.slice(-9), path],
		})),
	navigate: (path: string) => {
		const state = get()
		if (path !== state.currentPath) {
			set({ isNavigating: true })

			// 延迟重置导航状态，给loading动画足够时间
			setTimeout(() => set({ isNavigating: false }), 200)
		}
	},
})
