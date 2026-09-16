import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'
import { db } from '../src/db'
import { galleryImages, posts } from '../src/db/schema'
import {
	collectCloudinaryReferences,
	getUnreferencedAssetIds,
	normalizeCloudinaryPublicId,
} from '../src/lib/media/cloudinary-asset-audit'

const DEFAULT_MANIFEST = path.join(process.cwd(), 'media-cleanup-manifest.json')
const args = process.argv.slice(2)
const command = args[0] === 'cleanup' ? 'cleanup' : 'audit'
const manifestArgumentIndex = args.indexOf('--manifest')
const manifestPath = path.resolve(
	manifestArgumentIndex >= 0
		? args[manifestArgumentIndex + 1] || DEFAULT_MANIFEST
		: DEFAULT_MANIFEST,
)
const confirmed = args.includes('--confirm')

function configureCloudinary() {
	const {
		CLOUDINARY_CLOUD_NAME: cloudName,
		CLOUDINARY_API_KEY: apiKey,
		CLOUDINARY_API_SECRET: apiSecret,
	} = process.env
	if (!cloudName || !apiKey || !apiSecret)
		throw new Error(
			'需要 CLOUDINARY_CLOUD_NAME、CLOUDINARY_API_KEY 和 CLOUDINARY_API_SECRET',
		)
	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
		secure: true,
	})
}

async function getReferences() {
	const [galleryRows, postRows] = await Promise.all([
		db
			.select({
				publicId: galleryImages.publicId,
				url: galleryImages.url,
				thumbnailUrl: galleryImages.thumbnailUrl,
			})
			.from(galleryImages),
		db
			.select({
				slug: posts.slug,
				poster: posts.poster,
				content: posts.content,
			})
			.from(posts),
	])
	return collectCloudinaryReferences([
		...galleryRows.flatMap((row) => [
			{
				value: row.publicId,
				source: `GalleryImage:${row.publicId ?? 'unknown'}:publicId`,
			},
			{
				value: row.url,
				source: `GalleryImage:${row.publicId ?? 'unknown'}:url`,
			},
			{
				value: row.thumbnailUrl,
				source: `GalleryImage:${row.publicId ?? 'unknown'}:thumbnailUrl`,
			},
		]),
		...postRows.flatMap((row) => [
			{ value: row.poster, source: `Post:${row.slug}:poster` },
			{ value: row.content, source: `Post:${row.slug}:content` },
		]),
	])
}

async function listAssets() {
	const assets: Array<{
		public_id: string
		asset_id?: string
		bytes?: number
		created_at?: string
	}> = []
	let nextCursor: string | undefined
	do {
		const result = (await cloudinary.api.resources({
			resource_type: 'image',
			type: 'upload',
			prefix: 'myblog/',
			max_results: 500,
			...(nextCursor ? { next_cursor: nextCursor } : {}),
		})) as { resources?: typeof assets; next_cursor?: string }
		assets.push(...(result.resources ?? []))
		nextCursor = result.next_cursor
	} while (nextCursor)
	return assets
}

async function audit() {
	configureCloudinary()
	const references = await getReferences()
	const assets = await listAssets()
	const unreferenced = getUnreferencedAssetIds(assets, references)
	const manifest = {
		version: 1,
		generatedAt: new Date().toISOString(),
		rootPrefix: 'myblog/',
		assetCount: assets.length,
		referencedCount: assets.length - unreferenced.length,
		unreferencedPublicIds: unreferenced,
		references: Array.from(references.values()),
	}
	await fs.writeFile(
		manifestPath,
		`${JSON.stringify(manifest, null, 2)}\n`,
		'utf8',
	)
	console.log(`✅ 审计完成：Cloudinary myblog/ 下 ${assets.length} 个图片资源`)
	console.log(
		`当前引用：${manifest.referencedCount}，未引用：${unreferenced.length}`,
	)
	console.log(`清单：${manifestPath}`)
	console.log('只读审计未删除任何资产。')
}

async function cleanup() {
	if (!confirmed) throw new Error('删除操作必须同时提供 --confirm')
	const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as {
		rootPrefix?: string
		unreferencedPublicIds?: string[]
	}
	if (
		manifest.rootPrefix !== 'myblog/' ||
		!Array.isArray(manifest.unreferencedPublicIds)
	)
		throw new Error('清单格式无效或不是 myblog/ 资产清单')
	configureCloudinary()
	const references = await getReferences()
	const assets = await listAssets()
	const currentUnreferenced = new Set(
		getUnreferencedAssetIds(assets, references),
	)
	const targets = manifest.unreferencedPublicIds
		.map(normalizeCloudinaryPublicId)
		.filter((id): id is string => id !== null)
		.filter((id) => currentUnreferenced.has(id))
	if (targets.length === 0) {
		console.log('✅ 没有仍满足删除条件的资产。')
		return
	}
	console.log(`准备删除 ${targets.length} 个仍未被数据库引用的资产：`)
	for (const id of targets) console.log(`- ${id}`)
	const result = await cloudinary.api.delete_resources(targets, {
		resource_type: 'image',
		type: 'upload',
	})
	console.log(`✅ 删除请求已完成：${JSON.stringify(result)}`)
}

;(command === 'cleanup' ? cleanup : audit)().catch((error) => {
	console.error(
		`❌ Cloudinary 资产${command === 'cleanup' ? '清理' : '审计'}失败：${error instanceof Error ? error.message : String(error)}`,
	)
	process.exitCode = 1
})
