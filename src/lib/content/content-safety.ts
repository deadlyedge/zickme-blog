import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const RAW_MEDIA_PATTERN =
	/\.(?:jpe?g|png|gif|tiff?|bmp|orf|raw|cr2|cr3|nef|arw)$/i

export type ContentSafetyIssue = {
	path: string
	message: string
}

async function walkFiles(root: string): Promise<string[]> {
	const files: string[] = []
	const entries = await fs
		.readdir(root, { withFileTypes: true })
		.catch(() => [])
	for (const entry of entries) {
		const filePath = path.join(root, entry.name)
		if (entry.isDirectory()) files.push(...(await walkFiles(filePath)))
		else if (entry.isFile()) files.push(filePath)
	}
	return files
}

export async function findRawGalleryMedia(
	galleryRoot = path.join(process.cwd(), 'content/photo-gallery'),
): Promise<ContentSafetyIssue[]> {
	const files = await walkFiles(galleryRoot)
	return files
		.filter((filePath) => RAW_MEDIA_PATTERN.test(filePath))
		.map((filePath) => ({
			path: filePath,
			message:
				'原始媒体不能提交到 content/photo-gallery，请放入 content/.gallery-input',
		}))
}

export async function findTrackedGalleryInputs(
	inputRoot = path.join(process.cwd(), 'content/.gallery-input'),
): Promise<ContentSafetyIssue[]> {
	const inputFiles = await walkFiles(inputRoot)
	if (inputFiles.length === 0) return []

	const tracked = new Set<string>()
	const gitResult = spawnSync(
		'git',
		['ls-files', '--', 'content/.gallery-input'],
		{
			cwd: process.cwd(),
			encoding: 'utf8',
		},
	)
	if (gitResult.status === 0) {
		for (const line of gitResult.stdout.split(/\r?\n/)) {
			if (line.trim()) tracked.add(path.resolve(line.trim()))
		}
	}

	return inputFiles
		.filter((filePath) => tracked.has(path.resolve(filePath)))
		.map((filePath) => ({
			path: filePath,
			message:
				'Gallery 原始输入目录已被 Git 跟踪，必须移出暂存区并保持 .gitignore 忽略',
		}))
}

export async function checkContentSafety(): Promise<ContentSafetyIssue[]> {
	return [
		...(await findRawGalleryMedia()),
		...(await findTrackedGalleryInputs()),
	]
}
