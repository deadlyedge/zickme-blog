export function getPublicUserName(name?: string | null, email?: string | null) {
	const trimmedName = name?.trim()
	if (trimmedName) return trimmedName

	const emailPrefix = email?.split('@', 1)[0]?.trim()
	return emailPrefix || 'Anonymous'
}

export function getAvatarFallback(displayName: string) {
	const characters = Array.from(displayName.trim())
	return characters.slice(0, 2).join('').toUpperCase() || 'AN'
}
