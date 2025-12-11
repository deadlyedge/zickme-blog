'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateSiteProfile, getSiteProfile } from '@/lib/actions/profile'
import { toast } from 'sonner'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
} from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupTextarea,
} from '@/components/ui/input-group'
import { EditIcon } from 'lucide-react'
import { SiteProfile } from '@/generated/prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

const siteProfileSchema = z.object({
	name: z
		.string()
		.min(1, '站点名称不能为空')
		.max(100, '站点名称不能超过100个字符'),
	title: z
		.string()
		.min(1, '站点标题不能为空')
		.max(200, '站点标题不能超过200个字符'),
	bio: z
		.string()
		.min(1, '站点简介不能为空')
		.max(1000, '站点简介不能超过1000个字符'),
	avatar: z.url('请输入有效的头像链接').optional().or(z.literal('')),
	location: z.string().optional(),
	email: z.email('请输入有效的邮箱地址').optional().or(z.literal('')),
	website: z.url('请输入有效的网址').optional().or(z.literal('')),
})

type SiteProfileFormData = z.infer<typeof siteProfileSchema>

export function EditProfile() {
	const [open, setOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [currentProfile, setCurrentProfile] = useState<SiteProfile | null>(null)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		setValue,
	} = useForm<SiteProfileFormData>({
		resolver: zodResolver(siteProfileSchema),
		defaultValues: {
			name: '',
			title: '',
			bio: '',
			avatar: '',
			location: '',
			email: '',
			website: '',
		},
	})

	// Fetch current site profile when dialog opens
	useEffect(() => {
		if (open && !currentProfile) {
			getSiteProfile()
				.then(({ profile }) => {
					if (profile) {
						setCurrentProfile(profile)
						setValue('name', profile.name || '')
						setValue('title', profile.title || '')
						setValue('bio', profile.bio || '')
						setValue('avatar', profile.avatar || '')
						setValue('location', profile.location || '')
						setValue('email', profile.email || '')
						setValue('website', profile.website || '')
					}
				})
				.catch((error) => {
					console.error('Failed to fetch site profile:', error)
					toast.error('获取站点资料失败')
				})
		}
	}, [open, currentProfile, setValue])

	const onSubmit = async (data: SiteProfileFormData) => {
		try {
			setIsSubmitting(true)
			await updateSiteProfile({
				name: data.name,
				title: data.title,
				bio: data.bio,
				avatar: data.avatar || undefined,
				location: data.location || undefined,
				email: data.email || undefined,
				website: data.website || undefined,
			})
			toast.success('站点资料已更新')
			setOpen(false)
			// Reset current profile to force refetch on next open
			setCurrentProfile(null)
		} catch (error) {
			console.error('Update site profile error:', error)
			setError('root', {
				message: error instanceof Error ? error.message : '更新失败',
			})
			toast.error('更新失败')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<EditIcon className="h-4 w-4 mr-2" />
					编辑 SiteProfile
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>编辑站点资料</DialogTitle>
					<DialogDescription>修改站点的基本信息和联系方式。</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Tabs>
						<TabsList>
							<TabsTrigger value="base">Base</TabsTrigger>
							<TabsTrigger value="slogans">Slogans</TabsTrigger>
							<TabsTrigger value="skills">Skills</TabsTrigger>
						</TabsList>
						<TabsContent value="base">
							<FieldGroup>
								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>站点名称</InputGroupAddon>
											<InputGroupInput
												{...register('name')}
												placeholder="输入站点名称"
											/>
										</InputGroup>
										<FieldError errors={[errors.name]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>站点标题</InputGroupAddon>
											<InputGroupInput
												{...register('title')}
												placeholder="输入站点标题"
											/>
										</InputGroup>
										<FieldError errors={[errors.title]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>站点简介</InputGroupAddon>
											<InputGroupTextarea
												{...register('bio')}
												placeholder="输入站点简介"
												rows={4}
											/>
										</InputGroup>
										<FieldError errors={[errors.bio]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>头像链接</InputGroupAddon>
											<InputGroupInput
												type="url"
												{...register('avatar')}
												placeholder="输入头像链接"
											/>
										</InputGroup>
										<FieldError errors={[errors.avatar]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>位置</InputGroupAddon>
											<InputGroupInput
												{...register('location')}
												placeholder="输入位置信息"
											/>
										</InputGroup>
										<FieldError errors={[errors.location]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>邮箱</InputGroupAddon>
											<InputGroupInput
												type="email"
												{...register('email')}
												placeholder="输入联系邮箱"
											/>
										</InputGroup>
										<FieldError errors={[errors.email]} />
									</FieldContent>
								</Field>

								<Field>
									<FieldContent>
										<InputGroup>
											<InputGroupAddon>网站</InputGroupAddon>
											<InputGroupInput
												type="url"
												{...register('website')}
												placeholder="输入网站地址"
											/>
										</InputGroup>
										<FieldError errors={[errors.website]} />
									</FieldContent>
								</Field>

								{errors.root && <FieldError errors={[errors.root]} />}
							</FieldGroup>
						</TabsContent>
						<TabsContent value="slogans"></TabsContent>
						<TabsContent value="skills"></TabsContent>
					</Tabs>
					<DialogFooter>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? '保存中...' : '保存更改'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
