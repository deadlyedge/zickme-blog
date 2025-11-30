import { contentClient } from '@/lib/content/content-api'

const formatMonthYear = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const formatDuration = (start: string, end: string | null) => {
  const startLabel = formatMonthYear(start)
  const endLabel = end ? formatMonthYear(end) : 'Present'
  return `${startLabel} — ${endLabel}`
}

const formatPublishedDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function HomePage() {
  const {
    data: { profile, resumeEntries, blogPosts },
  } = await contentClient.index.get()

  const experiences = resumeEntries.filter((entry) => entry.sectionType === 'experience')
  const education = resumeEntries.filter((entry) => entry.sectionType === 'education')
  const projects = resumeEntries.filter((entry) => entry.sectionType === 'project')

  return (
    <div className="min-h-screen bg-slate-950/5 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16">
        <section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Resume ⋅ Journal</p>
          <h1 className="mt-4 text-5xl font-semibold text-slate-900">
            {profile?.name ?? 'Zickme'}
          </h1>
          <p className="text-2xl font-medium text-slate-600">{profile?.role ?? 'Full-stack builder'}</p>
          {profile?.tagline && <p className="mt-3 text-base text-slate-500">{profile.tagline}</p>}
          {profile?.intro && <p className="mt-4 text-base text-slate-600">{profile.intro}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            {profile?.skills?.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-slate-300/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {profile?.contactEmail && (
              <a className="hover:text-slate-900" href={`mailto:${profile.contactEmail}`}>
                {profile.contactEmail}
              </a>
            )}
            {profile?.location && <span>{profile.location}</span>}
          </div>
          {profile?.links && profile.links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {profile.links.map((link) => (
                <a
                  key={link.url}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                  href={link.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-lg shadow-slate-900/5">
          <div className="mb-8 flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Resume</p>
              <h2 className="text-3xl font-semibold text-slate-900">Experience & Education</h2>
            </div>
            <span className="text-sm text-slate-500">
              {experiences.length + education.length + projects.length} entries
            </span>
          </div>

          <div className="space-y-5">
            {experiences.length > 0 ? (
              experiences.map((entry) => (
                <article
                  key={`${entry.title}-${entry.company}-${entry.startDate}`}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-6"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{entry.title}</p>
                      {entry.company && (
                        <p className="text-sm text-slate-500">{entry.company}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {formatDuration(entry.startDate, entry.endDate)}
                    </p>
                  </header>
                  {entry.location && (
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{entry.location}</p>
                  )}
                  {entry.summary && (
                    <p className="mt-4 text-sm text-slate-600">{entry.summary}</p>
                  )}
                  {entry.highlights.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-slate-600">
                      {entry.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 rounded-full bg-slate-500" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {entry.url && (
                    <div className="mt-4 text-xs uppercase tracking-wide text-slate-500">
                      <a className="hover:text-slate-900" href={entry.url} target="_blank" rel="noreferrer">
                        Learn more
                      </a>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No experience entries published yet.</p>
            )}
          </div>

          {education.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Education</h3>
              </div>
              <div className="space-y-4">
                {education.map((entry) => (
                  <article key={`${entry.title}-edu`} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{entry.title}</p>
                        {entry.company && (
                          <p className="text-sm text-slate-500">{entry.company}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        {formatDuration(entry.startDate, entry.endDate)}
                      </span>
                    </div>
                    {entry.location && (
                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{entry.location}</p>
                    )}
                    {entry.summary && (
                      <p className="mt-3 text-sm text-slate-600">{entry.summary}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Projects & Highlights</h3>
              </div>
              <div className="space-y-4">
                {projects.map((entry) => (
                  <article key={`${entry.title}-project`} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="text-base font-semibold text-slate-900">{entry.title}</p>
                      <span className="text-xs font-medium text-slate-500">
                        {formatDuration(entry.startDate, entry.endDate)}
                      </span>
                    </div>
                    {entry.summary && (
                      <p className="mt-3 text-sm text-slate-600">{entry.summary}</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200/60 bg-white/90 p-10 shadow-lg shadow-slate-900/5">
          <div className="mb-8 flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Blog</p>
              <h2 className="text-3xl font-semibold text-slate-900">Notes & Ideas</h2>
            </div>
            <span className="text-sm text-slate-500">{blogPosts.length} stories</span>
          </div>

          {blogPosts.length === 0 ? (
            <p className="text-sm text-slate-500">No published posts yet.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {blogPosts.map((post) => (
                <article
                  key={post.slug}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div
                    className="h-36 w-full bg-slate-900/5"
                    style={
                      post.coverUrl
                        ? {
                            backgroundImage: `url(${post.coverUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  />
                  <div className="flex flex-col gap-3 p-6">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatPublishedDate(post.publishedAt)}</span>
                      <span>{post.readingTime ? `${post.readingTime} min read` : 'Quick read'}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                    <p className="text-sm text-slate-600">{post.summary}</p>
                    <div className="flex flex-wrap gap-2 text-xs uppercase tracking-widest text-slate-500">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
