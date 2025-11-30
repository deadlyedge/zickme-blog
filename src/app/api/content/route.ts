import { contentApp } from '@/lib/content/content-api'

export const dynamic = 'force-dynamic'

export const GET = (request: Request) => contentApp.handle(request)
