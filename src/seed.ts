import { getPayload } from 'payload'
import config from './payload.config'

async function seed() {
	const payload = await getPayload({ config })

	try {
		// 跳过媒体文件创建（需要实际文件）
		// 使用模拟的媒体ID
		// const createdMedia = [
		// 	{ id: 1 },
		// 	{ id: 2 },
		// 	{ id: 3 },
		// 	{ id: 4 },
		// ]
		// console.log('跳过媒体文件创建（需要实际文件），使用模拟ID')

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
			},
		]

		for (const profile of profiles) {
			const created = await payload.create({
				collection: 'profile',
				data: profile, // 移除avatar字段，因为媒体文件未实际创建
			})
			console.log(`个人资料创建成功: ${created.id}`)
		}

		// 创建项目
		console.log('创建项目...')
		const projects = [
			{
				title: '个人博客网站',
				slug: 'personal-blog-website',
				description: '使用Next.js和Payload CMS构建的现代化个人博客网站。',
				technologies: [
					{ name: 'Next.js' },
					{ name: 'Payload CMS' },
					{ name: 'TypeScript' },
					{ name: 'Tailwind CSS' },
				],
				// images: [  // 注释掉，因为媒体文件未实际创建
				// 	{ image: createdMedia[0].id, caption: '网站首页截图' },
				// 	{ image: createdMedia[1].id, caption: '博客页面截图' },
				// ],
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
				technologies: [
					{ name: 'React' },
					{ name: 'Node.js' },
					{ name: 'MongoDB' },
				],
				// images: [  // 注释掉，因为媒体文件未实际创建
				// 	{ image: createdMedia[0].id, caption: '应用界面截图' },
				// ],
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
				technologies: [
					{ name: 'Vue.js' },
					{ name: 'OpenWeather API' },
					{ name: 'Chart.js' },
				],
				// images: [  // 注释掉，因为媒体文件未实际创建
				// 	{ image: createdMedia[1].id, caption: '天气界面截图' },
				// ],
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
				// featuredImage: createdMedia[3].id, // 注释掉，因为媒体文件未实际创建
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

		for (const post of posts) {
			const created = await payload.create({
				collection: 'posts',
				data: post,
			})
			console.log(`博客文章创建成功: ${created.id}`)
		}

		console.log('所有测试数据创建完成！')
	} catch (error) {
		console.error('创建数据失败:', error)
		process.exit(1)
	}

	process.exit(0)
}

seed()
