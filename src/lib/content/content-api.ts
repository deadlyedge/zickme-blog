import { Elysia, t } from 'elysia'
import { edenTreaty } from '@elysiajs/eden'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Config } from '@/payload-types'

type BlogPostDocument = Config['collections']['blogPosts']
type ResumeEntryDocument = Config['collections']['resumeEntries']
type ProfileDocument = Config['collections']['resumeProfile']

export type ProfileLink = {
  label: string
  url: string
}

export type BlogPostViewModel = {
  title: string
  slug: string
  summary: string
  publishedAt: string
  coverUrl: string | null
  readingTime: number | null
  tags: string[]
}

export type ResumeEntryViewModel = {
  title: string
  company: string | null
  sectionType: 'experience' | 'education' | 'project' | 'skill'
  startDate: string
  endDate: string | null
  location: string | null
  summary: string | null
  highlights: string[]
  url: string | null
  order: number
}

export type ProfileViewModel = {
  name: string
  role: string
  tagline: string | null
  location: string | null
  contactEmail: string | null
  intro: string | null
  skills: string[]
  links: ProfileLink[]
}

export type ContentResponse = {
  profile: ProfileViewModel | null
  resumeEntries: ResumeEntryViewModel[]
  blogPosts: BlogPostViewModel[]
}

const stringOrNull = t.Union([t.String(), t.Null()])

const ProfileSchema = t.Object({
  name: t.String(),
  role: t.String(),
  tagline: stringOrNull,
  location: stringOrNull,
  contactEmail: stringOrNull,
  intro: stringOrNull,
  skills: t.Array(t.String()),
  links: t.Array(
    t.Object({
      label: t.String(),
      url: t.String(),
    }),
  ),
})

const ResumeEntrySchema = t.Object({
  title: t.String(),
  company: stringOrNull,
  sectionType: t.Union([
    t.Literal('experience'),
    t.Literal('education'),
    t.Literal('project'),
    t.Literal('skill'),
  ]),
  startDate: t.String(),
  endDate: stringOrNull,
  location: stringOrNull,
  summary: stringOrNull,
  highlights: t.Array(t.String()),
  url: stringOrNull,
  order: t.Number(),
})

const BlogPostSchema = t.Object({
  title: t.String(),
  slug: t.String(),
  summary: t.String(),
  publishedAt: t.String(),
  coverUrl: stringOrNull,
  readingTime: t.Union([t.Number(), t.Null()]),
  tags: t.Array(t.String()),
})

const ContentResponseSchema = t.Object({
  profile: t.Union([t.Null(), ProfileSchema]),
  resumeEntries: t.Array(ResumeEntrySchema),
  blogPosts: t.Array(BlogPostSchema),
})

const mapProfile = (profile: ProfileDocument | null): ProfileViewModel | null => {
  if (!profile) {
    return null
  }

  return {
    name: profile.name,
    role: profile.role,
    tagline: profile.tagline ?? null,
    location: profile.location ?? null,
    contactEmail: profile.contactEmail ?? null,
    intro: profile.intro ?? null,
    skills: profile.skills?.map((skill) => skill.skill ?? '').filter(Boolean) ?? [],
    links:
      profile.links
        ?.map((link) => (link.label && link.url ? { label: link.label, url: link.url } : null))
        .filter((link): link is ProfileLink => Boolean(link)) ?? [],
  }
}

const mapResumeEntry = (entry: ResumeEntryDocument): ResumeEntryViewModel => ({
  title: entry.title,
  company: entry.company ?? null,
  sectionType: entry.sectionType,
  startDate: entry.startDate,
  endDate: entry.endDate ?? null,
  location: entry.location ?? null,
  summary: entry.summary ?? null,
  highlights: entry.highlights?.map((item) => item.item ?? '').filter(Boolean) ?? [],
  url: entry.url ?? null,
  order: entry.order ?? 0,
})

const mapBlogPost = (post: BlogPostDocument): BlogPostViewModel => ({
  title: post.title,
  slug: post.slug,
  summary: post.summary,
  publishedAt: post.publishedAt,
  coverUrl: post.cover?.url ?? null,
  readingTime: post.readingTime ?? null,
  tags: post.tags?.map((tag) => tag.tag ?? '').filter(Boolean) ?? [],
})

const fetchContent = async (): Promise<ContentResponse> => {
  const payload = await getPayload({
    config: configPromise,
  })

  const [profileResult, resumeResult, blogResult] = await Promise.all([
    payload.find({
      collection: 'resumeProfile',
      limit: 1,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'resumeEntries',
      where: {
        status: {
          equals: 'published',
        },
      },
      sort: 'order,-startDate',
      limit: 50,
    }),
    payload.find({
      collection: 'blogPosts',
      where: {
        status: {
          equals: 'published',
        },
      },
      sort: '-publishedAt',
      limit: 6,
    }),
  ])

  return {
    profile: mapProfile(profileResult.docs[0] ?? null),
    resumeEntries: resumeResult.docs.map(mapResumeEntry),
    blogPosts: blogResult.docs.map(mapBlogPost),
  }
}

export const contentApp = new Elysia().get('/', fetchContent, {
  schema: {
    response: ContentResponseSchema,
  },
})

export type ContentApp = typeof contentApp
export const contentClient = edenTreaty<ContentApp>('/api/content')
