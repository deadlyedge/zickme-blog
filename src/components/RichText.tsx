'use client'

import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

type Props = {
	value: SerializedEditorState | null | undefined
}

export function RichText({ value }: Props) {
	if (!value) return null
	return (
		<div className="prose max-w-none">
			<PayloadRichText data={value} />
		</div>
	)
}
