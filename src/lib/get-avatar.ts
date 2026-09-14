import crypto from 'node:crypto'

export function getGravatarAvatarUrl(email: string, size = 256) {
	const identifier = email.trim().toLowerCase()
	const hash = crypto.createHash('sha256').update(identifier).digest('hex')
	return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`
}
