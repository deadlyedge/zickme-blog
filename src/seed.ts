import { getPayload } from 'payload'
import config from './payload.config'
import fs from 'fs'
import path from 'path'

async function seed() {
	const payload = await getPayload({ config })

	try {
		// 创建媒体文件
		console.log('创建媒体文件...')
		const mediaFiles = [
			{ filename: 'logo_512.png', alt: '网站Logo' },
			{ filename: 'meFace_bigEyeball.jpg', alt: '头像照片' },
			{ filename: '41S86019Z6L__AA240_.jpg', alt: '项目截图1' },
			{ filename: '51790747.jpg', alt: '项目截图2' },
			{ filename: '1729111.jpg', alt: '博客特色图片' },
		]

		const createdMedia = []
		for (const mediaFile of mediaFiles) {
			const filePath = path.join(process.cwd(), 'media', mediaFile.filename)
			if (fs.existsSync(filePath)) {
				const fileBuffer = fs.readFileSync(filePath)
				const mimeType = mediaFile.filename.endsWith('.png') ? 'image/png' :
				                mediaFile.filename.endsWith('.jpg') || mediaFile.filename.endsWith('.jpeg') ? 'image/jpeg' :
				                mediaFile.filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg'

				const created = await payload.create({
					collection: 'media',
					data: {
						alt: mediaFile.alt,
					},
					file: {
						data: fileBuffer,
						name: mediaFile.filename,
						mimetype: mimeType,
						size: fileBuffer.length,
					},
				})
				createdMedia.push(created)
				console.log(`媒体文件创建成功: ${created.id} - ${mediaFile.filename}`)
			} else {
				console.log(`媒体文件不存在，跳过: ${mediaFile.filename}`)
			}
		}

		// 创建标签
		console.log('创建标签...')
		const tags = [
			{ name: 'JavaScript', slug: 'javascript', color: '#f7df1e' },
			{ name: 'React', slug: 'react', color: '#61dafb' },
			{ name: 'Next.js', slug: 'next-js', color: '#000000' },
			{ name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
			{ name: 'Node.js', slug: 'node-js', color: '#339933' },
		]

		const createdTags = []
		for (const tag of tags) {
			const created = await payload.create({
				collection: 'tags',
				data: tag,
				draft: false,
			})
			createdTags.push(created)
			console.log(`标签创建成功: ${created.id}`)
		}

		// 创建用户
		console.log('创建用户...')
		const users = [
			{
				email: 'xdream@gmail.com',
				password: 'test',
				username: 'xdream',
				roles: ['admin' as const],
			},
			{
				email: 'user1@example.com',
				password: 'password123',
				username: 'user1',
				roles: ['user' as const],
			},
			{
				email: 'user2@example.com',
				password: 'password123',
				username: 'user2',
				roles: ['user' as const],
			},
		]

		const createdUsers = []
		for (const user of users) {
			const created = await payload.create({
				collection: 'users',
				data: user,
			})
			createdUsers.push(created)
			console.log(`用户创建成功: ${created.id}`)
		}

		// 创建个人资料
		console.log('创建个人资料...')
		const profiles = [
			{
				name: '张三',
				title: '全栈开发者',
				bio: '热爱编程，专注于Web开发和人工智能领域。',
				avatar: createdMedia[1].id, // 使用头像照片
				location: '北京',
				email: 'xdream@gmail.com',
				website: 'https://example.com',
				socialLinks: [
					{ platform: 'GitHub' as const, url: 'https://github.com/xdream', username: 'xdream' },
					{ platform: 'LinkedIn' as const, url: 'https://linkedin.com/in/xdream', username: 'xdream' },
				],
				skills: [
					{
						category: '前端开发',
						technologies: [
							{ name: 'React', level: 'advanced' as const },
							{ name: 'Next.js', level: 'expert' as const },
							{ name: 'TypeScript', level: 'advanced' as const },
						],
					},
					{
						category: '后端开发',
						technologies: [
							{ name: 'Node.js', level: 'advanced' as const },
							{ name: 'PostgreSQL', level: 'intermediate' as const },
						],
					},
				],
				slogans: [
					{ text: '代码改变世界', fontSize: 'text-4xl' as const, color: '#3b82f6' },
					{ text: '持续学习，持续进步', fontSize: 'text-2xl' as const },
					{ text: 'Full Stack Developer', fontSize: 'text-3xl' as const, color: '#10b981' },
				],
			},
		]

		const createdProfiles = []
		for (const profile of profiles) {
			const created = await payload.create({
				collection: 'profile',
				data: profile,
			})
			createdProfiles.push(created)
			console.log(`个人资料创建成功: ${created.id}`)
		}

		// 创建项目
		console.log('创建项目...')
		const projects = [
			{
				title: '个人博客网站',
				slug: 'personal-blog-website',
				description: '使用Next.js和Payload CMS构建的现代化个人博客网站。',
				longDescription: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: '这是一个功能完整的个人博客网站，包含博客文章、项目展示、个人资料等多个模块。前端使用Next.js 14和TypeScript构建，后端使用Payload CMS管理内容。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				technologies: [
					{ name: 'Next.js', url: 'https://nextjs.org' },
					{ name: 'Payload CMS', url: 'https://payloadcms.com' },
					{ name: 'TypeScript', url: 'https://typescriptlang.org' },
					{ name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
				],
				images: [
					{ image: createdMedia[2].id, caption: '网站首页截图' },
					{ image: createdMedia[3].id, caption: '博客页面截图' },
				],
				demoUrl: 'https://example.com',
				sourceUrl: 'https://github.com/xdream/blog',
				featured: true,
				startDate: '2024-01-01',
				endDate: '2024-03-01',
			},
			{
				title: '任务管理应用',
				slug: 'task-management-app',
				description: '一个简单高效的任务管理应用，支持团队协作。',
				longDescription: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: '任务管理应用支持创建、编辑、删除任务，以及分配给团队成员。包含任务状态跟踪、截止日期提醒、团队协作功能。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				technologies: [
					{ name: 'React', url: 'https://reactjs.org' },
					{ name: 'Node.js', url: 'https://nodejs.org' },
					{ name: 'MongoDB', url: 'https://mongodb.com' },
				],
				images: [
					{ image: createdMedia[2].id, caption: '应用界面截图' },
				],
				demoUrl: 'https://todo-app.example.com',
				sourceUrl: 'https://github.com/xdream/todo-app',
				featured: false,
				startDate: '2024-04-01',
				endDate: '2024-06-01',
			},
			{
				title: '天气预报应用',
				slug: 'weather-forecast-app',
				description: '实时天气预报应用，提供准确的天气信息。',
				longDescription: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: '天气预报应用集成OpenWeather API，提供当前天气、未来7天预报、空气质量等信息。包含漂亮的天气图标和图表展示。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				technologies: [
					{ name: 'Vue.js', url: 'https://vuejs.org' },
					{ name: 'OpenWeather API', url: 'https://openweathermap.org/api' },
					{ name: 'Chart.js', url: 'https://chartjs.org' },
				],
				images: [
					{ image: createdMedia[3].id, caption: '天气界面截图' },
				],
				demoUrl: 'https://weather.example.com',
				sourceUrl: 'https://github.com/xdream/weather-app',
				featured: true,
				startDate: '2024-07-01',
			},
		]

		const createdProjects = []
		for (const project of projects) {
			const created = await payload.create({
				collection: 'projects',
				data: project,
				draft: false,
			})
			createdProjects.push(created)
			console.log(`项目创建成功: ${created.id}`)
		}

		// 创建博客文章
		console.log('创建博客文章...')
		const posts = [
			{
				title: '欢迎来到我的博客',
				slug: 'welcome-to-my-blog',
				content: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: '这是我的第一篇博客文章。在这里，我将分享我的编程经验和学习心得。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				excerpt: '博客的第一篇文章，介绍博客的内容和方向。',
				featuredImage: createdMedia[4].id, // 使用博客特色图片
				tags: [createdTags[0].id, createdTags[2].id],
				status: 'published' as const,
				publishedAt: '2024-01-15',
			},
			{
				title: 'Next.js 16 新特性介绍',
				slug: 'nextjs-16-new-features',
				content: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: 'Next.js 16 带来了许多令人兴奋的新特性，包括改进的性能和开发体验。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				excerpt: '探索Next.js 16的新功能和改进。',
				featuredImage: createdMedia[4].id,
				tags: [createdTags[1].id, createdTags[2].id],
				status: 'published' as const,
				publishedAt: '2024-02-01',
			},
			{
				title: 'TypeScript 最佳实践',
				slug: 'typescript-best-practices',
				content: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: 'TypeScript 提供了强大的类型系统，帮助我们编写更可靠的代码。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				excerpt: '学习TypeScript的最佳实践和技巧。',
				featuredImage: createdMedia[4].id,
				tags: [createdTags[3].id],
				status: 'published' as const,
				publishedAt: '2024-02-15',
			},
			{
				title: '未来的博客文章',
				slug: 'future-blog-post',
				content: {
					root: {
						type: 'root',
						children: [
							{
								type: 'paragraph',
								children: [
									{
										type: 'text',
										text: '这是一篇草稿文章，还在撰写中。',
									},
								],
								direction: 'ltr' as const,
								format: '' as const,
								indent: 0,
								version: 1,
							},
						],
						direction: 'ltr' as const,
						format: '' as const,
						indent: 0,
						version: 1,
					},
				},
				excerpt: '即将发布的文章预告。',
				tags: [createdTags[0].id],
				status: 'draft' as const,
			},
		]

		const createdPosts = []
		for (const post of posts) {
			const created = await payload.create({
				collection: 'posts',
				data: post,
			})
			createdPosts.push(created)
			console.log(`博客文章创建成功: ${created.id}`)
		}

		// 创建评论
		console.log('创建评论...')
		const comments = [
			{
				content: '很棒的文章！学到了很多东西。',
				doc: { relationTo: 'posts' as const, value: createdPosts[0].id },
				author: {
					name: '访客用户',
					email: 'guest@example.com',
				},
				status: 'published' as const,
			},
			{
				content: 'Next.js 16 的新特性确实很强大。',
				doc: { relationTo: 'posts' as const, value: createdPosts[1].id },
				author: {
					user: createdUsers[1].id,
					name: 'user1',
					email: 'user1@example.com',
				},
				status: 'published' as const,
			},
			{
				content: 'TypeScript 的类型系统确实能提高代码质量。',
				doc: { relationTo: 'posts' as const, value: createdPosts[2].id },
				author: {
					user: createdUsers[2].id,
					name: 'user2',
					email: 'user2@example.com',
				},
				status: 'published' as const,
			},
			{
				content: '这个项目看起来很不错！',
				doc: { relationTo: 'projects' as const, value: createdProjects[0].id },
				author: {
					name: '项目爱好者',
					email: 'fan@example.com',
				},
				status: 'pending' as const,
			},
		]

		for (const comment of comments) {
			const created = await payload.create({
				collection: 'comments',
				data: comment,
			})
			console.log(`评论创建成功: ${created.id}`)
		}

		console.log('所有测试数据创建完成！')
	} catch (error) {
		console.error('创建数据失败:', error)
		process.exit(1)
	}

	process.exit(0)
}

seed()
