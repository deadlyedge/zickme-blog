'use client'

import { Layout, Palette, User } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AboutSettings } from './AboutSettings'
import { LandingSettings } from './LandingSettings'
import { SocialSettings } from './SocialSettings'
import { ThemeSettings } from './ThemeSettings'
import type { SettingsTabsProps } from './types'

export function SettingsTabs(props: SettingsTabsProps) {
	return (
		<Tabs defaultValue="theme" className="space-y-6">
			<TabsList className="grid w-full grid-cols-4 max-w-2xl shadow-2xs">
				<TabsTrigger value="theme" className="gap-2 text-xs sm:text-sm">
					<Palette className="h-3.5 w-3.5" />
					动态主题
				</TabsTrigger>
				<TabsTrigger value="landing" className="gap-2 text-xs sm:text-sm">
					<Layout className="h-3.5 w-3.5" />
					首页编排
				</TabsTrigger>
				<TabsTrigger value="about" className="gap-2 text-xs sm:text-sm">
					<User className="h-3.5 w-3.5" />
					关于页内容
				</TabsTrigger>
				<TabsTrigger value="social" className="gap-2 text-xs sm:text-sm">
					<User className="h-3.5 w-3.5" />
					Social Networks
				</TabsTrigger>
			</TabsList>
			<TabsContent value="theme">
				<ThemeSettings {...props} />
			</TabsContent>
			<TabsContent value="landing">
				<LandingSettings {...props} />
			</TabsContent>
			<TabsContent value="about">
				<AboutSettings {...props} />
			</TabsContent>
			<TabsContent value="social">
				<SocialSettings {...props} />
			</TabsContent>
		</Tabs>
	)
}
