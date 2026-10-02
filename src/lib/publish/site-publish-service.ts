import * as fs from 'node:fs/promises'
import path from 'node:path'
import { getCloudinaryConfiguration } from '@/lib/media/cloudinary-client'
import { buildSitePublicId } from '@/lib/media/cloudinary-public-id'
import { uploadCloudinaryImage } from '@/lib/media/cloudinary-upload'
import {
	getSitePublishValues,
	readSiteFiles,
	SITE_CONTENT_ROOT,
	SITE_PORTRAIT_PATH,
	SiteContentError,
	validatePinnedPostSlugs,
} from './site-input-reader'
import { resolvePostIdsBySlugs, upsertSiteProfile } from './site-repository'

export interface SitePublishSummary {
	profiles: number
	portraitUploaded: number
	pinnedPosts: number
	errors: number
}

export async function publishSite(
	options: { dryRun?: boolean; siteRoot?: string; postsRoot?: string } = {},
): Promise<SitePublishSummary> {
	const dryRun = options.dryRun === true
	const siteRoot = options.siteRoot ?? SITE_CONTENT_ROOT
	const files = await readSiteFiles(siteRoot)
	await validatePinnedPostSlugs(files.landing, options.postsRoot)

	const pinnedSlugs = files.landing?.pinnedPostSlugs ?? []
	let pinnedPostIds: string[] = []
	if (!dryRun) pinnedPostIds = await resolvePostIdsBySlugs(pinnedSlugs)

	let avatarUrl: string | null = null
	let portraitUploaded = 0
	if (files.profile.portraitImage) {
		avatarUrl = `pending:${buildSitePublicId('portrait.webp')}`
		if (dryRun) {
			// Identify the local asset in the dry-run summary without uploading it.
		} else {
			if (!getCloudinaryConfiguration().configured)
				throw new SiteContentError(
					'站点头像需要配置完整的 Cloudinary 凭据后才能真实发布。',
					path.join(siteRoot, 'portrait.webp'),
				)
			const portrait = await fs.readFile(
				path.join(siteRoot, path.basename(SITE_PORTRAIT_PATH)),
			)
			const uploaded = await uploadCloudinaryImage(
				portrait,
				buildSitePublicId('portrait.webp'),
				{ format: 'webp', overwrite: true, invalidate: true },
			)
			avatarUrl = uploaded.secure_url
			portraitUploaded = 1
		}
	}

	if (!dryRun)
		await upsertSiteProfile(
			getSitePublishValues(files, avatarUrl, pinnedPostIds),
		)

	return {
		profiles: 1,
		portraitUploaded,
		pinnedPosts: pinnedSlugs.length,
		errors: 0,
	}
}
