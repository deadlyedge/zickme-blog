import type { Metadata } from 'next'
import {
	AboutHero,
	ContactCardsSection,
	FeaturedProjectsSection,
	SkillsSection,
	TimelineSection,
} from '@/components/about'
import { fetchProfile } from '@/lib/content-providers'
import { buildMetadata } from '@/lib/seo'
import type { TimelineItem } from '@/types'

export const revalidate = 3600 // 每小时重新验证一次

export const metadata: Metadata = buildMetadata({
	title: 'About',
	description:
		'Learn more about my background, career experience, tech stack, and open source projects.',
})

// 默认兜底经历时间线（若数据库尚未录入时提供高质量的结构展示）
const DEFAULT_CAREER_TIMELINE: TimelineItem[] = [
	{
		id: 'default-exp-1',
		period: '2024 - Present',
		role: 'Senior Full Stack Engineer',
		company: 'Modern Web & Cloud Architecture',
		location: 'Remote',
		description:
			'Designing and building high-performance web applications, distributed backend services, and developer tools using Next.js, TypeScript, and modern Cloud ecosystems.',
		achievements: [
			'Engineered scalable personal blog and content management system with App Router and Drizzle ORM.',
			'Architected streamlined data pipelines with automated validation and fast full-text search indexing.',
		],
		technologies: [
			'Next.js',
			'React 19',
			'TypeScript',
			'Tailwind CSS',
			'Drizzle ORM',
			'PostgreSQL',
		],
	},
	{
		id: 'default-exp-2',
		period: '2022 - 2024',
		role: 'Frontend & UI Systems Specialist',
		company: 'Interactive Digital Experience',
		location: 'Shenzhen / Remote',
		description:
			'Focused on fluid motion design, component systems, and optimizing web vitals for data-dense frontend dashboards.',
		achievements: [
			'Built custom micro-interaction motion libraries with 60fps performance on mobile devices.',
			'Refactored legacy monolith into composable modular micro-frontends.',
		],
		technologies: [
			'React',
			'TypeScript',
			'Motion',
			'Node.js',
			'Zustand',
			'GraphQL',
		],
	},
]

export default async function AboutPage() {
	const profileData = await fetchProfile()

	if (!profileData) {
		return (
			<div className="pt-24 min-h-screen flex items-center justify-center">
				<p className="text-muted-foreground">暂无个人资料</p>
			</div>
		)
	}

	const aboutConfig = profileData.aboutPageConfig

	return (
		<main className="min-h-screen pt-20 pb-16 bg-background">
			<div className="mx-auto max-w-4xl px-6 sm:px-8 space-y-4">
				{/* 1. Hero 个人导语与即时状态 */}
				<AboutHero profile={profileData} aboutConfig={aboutConfig} />

				{/* 2. 职业生涯经历时间线 */}
				<TimelineSection
					title="Work & Career Experience"
					description="A chronicle of engineering roles, leadership positions, and system architecture challenges I've tackled."
					items={aboutConfig?.careerTimeline}
					emptyFallback={DEFAULT_CAREER_TIMELINE}
				/>

				{/* 3. 教育背景与学术经历（若有配置） */}
				{aboutConfig?.educationTimeline &&
					aboutConfig.educationTimeline.length > 0 && (
						<TimelineSection
							title="Education & Academic Background"
							description="Degrees, academic foundations, and formal training in computer science and engineering."
							items={aboutConfig.educationTimeline}
						/>
					)}

				{/* 4. 技能栈与常用工具库 */}
				<SkillsSection skills={profileData.skills} />

				{/* 5. 精选项目与开源亮点（若有配置） */}
				{aboutConfig?.featuredProjects &&
					aboutConfig.featuredProjects.length > 0 && (
						<FeaturedProjectsSection projects={aboutConfig.featuredProjects} />
					)}

				{/* 6. 社交媒体与联系卡片 */}
				<ContactCardsSection profile={profileData} />
			</div>
		</main>
	)
}
