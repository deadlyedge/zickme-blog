import { StateCreator } from 'zustand'
import { AppState, CommentState, CommentActions } from './types'

export const createCommentSlice: StateCreator<
	AppState,
	[],
	[],
	CommentState & CommentActions
> = (set) => ({
	// State
	activeReplyId: null,

	// Actions
	setActiveReplyId: (id: string | null) => set({ activeReplyId: id }),
	clearActiveReplyId: () => set({ activeReplyId: null }),
})
