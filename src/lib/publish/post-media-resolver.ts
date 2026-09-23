import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { buildPostMediaPublicId } from '@/lib/media/post-media'

type PostMediaResolverOptions = {
	dryRun: boolean
	uploadBuffer: (buffer: Buffer, publicId: string) => Promise<string | null>
}

type ImageReplacement = {
	original: string
	replaced: string
}

export function normalizePostImagePath(imagePath: string): string {
	if (imagePath.startsWith('./')) return imagePath.slice(2)
	if (imagePath.startsWith('/')) return imagePath.slice(1)
	return imagePath
}

export function getPostImageRelativePath(
	relativeFilePath: string,
	imagePath: string,
): string {
	const fileDir = path.dirname(relativeFilePath)
	const normalizedImagePath = normalizePostImagePath(imagePath)
	const combinedPath =
		fileDir && fileDir !== '.'
			? path.join(fileDir, normalizedImagePath)
			: normalizedImagePath
	return combinedPath.replace(/\\/g, '/')
}

export function replaceMarkdownImages(
	content: string,
	replacements: ImageReplacement[],
): string {
	let finalContent = content
	for (const replacement of replacements) {
		finalContent = finalContent.replace(
			replacement.original,
			replacement.replaced,
		)
	}
	return finalContent
}

export class PostMediaResolver {
	constructor(private readonly options: PostMediaResolverOptions) {}

	async resolveAndUploadImage(
		imagePath: string,
		relativeFilePath: string,
		postSlug: string,
		virtualImagesMap?: Map<string, Buffer>,
		basePostsDir?: string,
	): Promise<string> {
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://'))
			return imagePath
		if (this.options.dryRun) return imagePath

		const normalizedImagePath = normalizePostImagePath(imagePath)
		const cleanCombinedPath = getPostImageRelativePath(
			relativeFilePath,
			imagePath,
		)
		const publicId = buildPostMediaPublicId(postSlug, cleanCombinedPath)

		if (virtualImagesMap) {
			for (const [virtualPath, buffer] of virtualImagesMap.entries()) {
				const normalizedVirtualPath = virtualPath.replace(/\\/g, '/')
				if (
					normalizedVirtualPath === cleanCombinedPath ||
					normalizedVirtualPath.endsWith(normalizedImagePath)
				) {
					const url = await this.options.uploadBuffer(buffer, publicId)
					if (!url) throw new Error(`Post 图片上传失败: ${publicId}`)
					return url
				}
			}
		}

		if (basePostsDir) {
			const absoluteImagePath = path.resolve(
				path.isAbsolute(relativeFilePath)
					? path.dirname(relativeFilePath)
					: path.join(basePostsDir, path.dirname(relativeFilePath)),
				imagePath,
			)

			try {
				const imageStat = await fs.stat(absoluteImagePath)
				if (imageStat.isFile()) {
					const buffer = await fs.readFile(absoluteImagePath)
					const url = await this.options.uploadBuffer(buffer, publicId)
					if (!url) throw new Error(`Post 图片上传失败: ${publicId}`)
					return url
				}
			} catch {
				// Preserve the original fallback behavior for missing/unreadable files.
			}
		}

		throw new Error(`Post 图片文件不存在: ${imagePath}`)
	}

	async resolveMarkdownImages(
		content: string,
		relativeFilePath: string,
		postSlug: string,
		virtualImagesMap?: Map<string, Buffer>,
		basePostsDir?: string,
	): Promise<string> {
		const replacements: ImageReplacement[] = []
		const imageRegex = /!\[(.*?)\]\((.*?)\)/g
		const matches = Array.from(content.matchAll(imageRegex))

		for (const match of matches) {
			const fullMatch = match[0]
			const altText = match[1]
			const source = match[2]?.split(' ')[0]

			if (
				source &&
				!source.startsWith('http://') &&
				!source.startsWith('https://')
			) {
				const uploadedUrl = await this.resolveAndUploadImage(
					source,
					relativeFilePath,
					postSlug,
					virtualImagesMap,
					basePostsDir,
				)
				replacements.push({
					original: fullMatch,
					replaced: `![${altText}](${uploadedUrl})`,
				})
			}
		}

		return replaceMarkdownImages(content, replacements)
	}
}
