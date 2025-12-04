'use server'

import {
	fetchBlogPosts,
	fetchBlogPostBySlug,
	fetchProjects,
	fetchTags,
	BlogPostViewModel,
	ProjectViewModel,
	TagViewModel,
	BlogPostDetailViewModel,
} from '../content-providers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { safeExtract } from '@/lib/utils'
import { Project } from '@/payload-types'

export async function fetchBlogPostsAction(): Promise<BlogPostViewModel[]> {
	try {
		return await fetchBlogPosts()
	} catch (error) {
		console.error('Error fetching blog posts:', error)
		throw new Error('Failed to fetch blog posts')
	}
}

export async function fetchProjectsAction(): Promise<ProjectViewModel[]> {
	try {
		return await fetchProjects()
	} catch (error) {
		console.error('Error fetching projects:', error)
		throw new Error('Failed to fetch projects')
	}
}

export async function fetchTagsAction(): Promise<TagViewModel[]> {
	try {
		return await fetchTags()
	} catch (error) {
		console.error('Error fetching tags:', error)
		throw new Error('Failed to fetch tags')
	}
}

export async function fetchBlogPostBySlugAction(
	slug: string,
): Promise<BlogPostDetailViewModel | null> {
	try {
		return await fetchBlogPostBySlug(slug)
	} catch (error) {
		console.error(`Error fetching blog post ${slug}:`, error)
		throw new Error(`Failed to fetch blog post ${slug}`)
	}
}

export async function fetchProjectBySlugAction(
	slug: string,
): Promise<ProjectViewModel | null> {
	try {
		// We need to implement fetchProjectBySlug in content-providers or implement it here
		// Checking content-providers.ts, there is no fetchProjectBySlug exported.
		// So implementing it here similar to how it's likely implemented or reuse the logic.
		// Looking at api/projects/[slug]/route.ts might have given a clue but we can just implement it using payload.

		const payload = await getPayload({
			config: configPromise,
		})

		const projectsResult = await payload.find({
			collection: 'projects',
			where: {
				slug: {
					equals: slug,
				},
			},
			depth: 2,
		})

		const project = projectsResult.docs[0]
		if (!project) {
			return null
		}

		// Mapper logic duplicated from content-providers because it wasn't exported
		const mapProject = (project: Project): ProjectViewModel => {
			const images =
				project.images?.map((img) => {
					const image = safeExtract(img.image)
					return {
						url: image?.url ?? null,
						caption: img.caption ?? null,
					}
				}) ?? []

			return {
				...project,
				images,
			}
		}

		return mapProject(project)
	} catch (error) {
		console.error(`Error fetching project ${slug}:`, error)
		throw new Error(`Failed to fetch project ${slug}`)
	}
}
