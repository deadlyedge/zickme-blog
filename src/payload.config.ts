// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Projects } from './collections/Projects'
import { Profile } from './collections/Profile'
import { Tags } from './collections/Tags'
import { Comments } from './collections/Comments'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
	admin: {
		user: Users.slug,
		importMap: {
			baseDir: path.resolve(dirname),
		},
	},
	collections: [Users, Media, Profile, Projects, Posts, Tags, Comments],
	editor: lexicalEditor(),
	secret: process.env.PAYLOAD_SECRET || '',
	typescript: {
		outputFile: path.resolve(dirname, 'payload-types.ts'),
	},
	db: postgresAdapter({
		pool: {
			connectionString: process.env.DATABASE_URL || '',
			max: 10,
		},
	}),
	sharp,
	plugins: [
		// storage-adapter-placeholder
		vercelBlobStorage({
			enabled: true,
			collections: {
				[Media.slug]: {
					prefix: 'media',
					allowClientUpload: true,
				},
			},
			token: process.env.BLOB_READ_WRITE_TOKEN || '',
		}),
	],
})
