import { createAvatar } from '@dicebear/core'
import { initials, croodles } from '@dicebear/collection'

type AvatarProps = {
	seed: string
	variant?: 'initials' | 'croodles'
}

export const generateAvatarUri = ({
	seed,
	variant = 'initials',
}: AvatarProps) => {
	const avatar = createAvatar(variant === 'initials' ? initials : croodles, {
		seed,
	})

	return avatar.toDataUri()
}
