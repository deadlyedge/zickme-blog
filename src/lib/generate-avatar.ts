// import { croodles, initials } from '@dicebear/collection'
import { Avatar, Style } from '@dicebear/core'
import croodles from '@dicebear/styles/croodles.json' with { type: 'json' }
import initials from '@dicebear/styles/initials.json' with { type: 'json' }

type AvatarProps = {
	seed: string
	variant?: 'initials' | 'croodles'
}

const initialsStyle = new Style(initials)
const croodlesStyle = new Style(croodles)

export const generateAvatarUri = ({
	seed,
	variant = 'initials',
}: AvatarProps) => {
	const avatar = new Avatar(
		variant === 'initials' ? initialsStyle : croodlesStyle,
		{
			seed,
		},
	)

	return avatar.toDataUri()
}
