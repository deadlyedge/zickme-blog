import { StateCreator } from 'zustand'
import { AppState, NavigationActions, NavigationState } from './types'

export const createNavigationSlice: StateCreator<
	AppState,
	[],
	[],
	NavigationState & NavigationActions
> = (set) => ({
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
})
