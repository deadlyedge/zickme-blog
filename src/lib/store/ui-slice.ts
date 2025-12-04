import { StateCreator } from 'zustand'
import { AppState, UIActions, UIState } from './types'

export const createUISlice: StateCreator<
	AppState,
	[],
	[],
	UIState & UIActions
> = (set) => ({
	loadingStates: {
		blogPosts: false,
		projects: false,
		tags: false,
		pageTransition: false,
	},
	errorStates: {
		blogPosts: null,
		projects: null,
		tags: null,
	},

	setLoading: (key, loading) =>
		set((state) => ({
			loadingStates: { ...state.loadingStates, [key]: loading },
		})),
	setError: (key, error) =>
		set((state) => ({
			errorStates: { ...state.errorStates, [key]: error },
		})),
})
