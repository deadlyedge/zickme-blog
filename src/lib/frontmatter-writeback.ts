import * as fs from 'node:fs/promises'
import matter from 'gray-matter'

export async function writeBackPostPoster(
	filePath: string,
	poster: string | null,
): Promise<void> {
	const raw = await fs.readFile(filePath, 'utf8')
	const parsed = matter(raw)
	if (poster) parsed.data.image = poster
	else delete parsed.data.image
	await fs.writeFile(
		filePath,
		`${matter.stringify(parsed.content, parsed.data).trim()}\n`,
		'utf8',
	)
}

export async function shouldWriteBackPoster(
	filePath: string,
	databaseUpdatedAt: Date,
): Promise<boolean> {
	const stat = await fs.stat(filePath)
	return databaseUpdatedAt.getTime() > stat.mtime.getTime() + 2000
}
