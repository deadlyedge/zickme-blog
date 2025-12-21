import { croodles, initials } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'

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
