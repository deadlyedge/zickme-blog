'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateSiteProfile, getSiteProfile } from '@/lib/actions/profile'
import { toast } from 'sonner'

import { EditIcon, PlusIcon, SaveIcon, XIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
	Select,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select'
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
	slogans: z
		.array(
			z.object({
				text: z.string().min(1, '口号文本不能为空'),
				fontSize: z.string().optional(),
				color: z.string().optional(),
			}),
		)
		.optional(),
	skills: z
		.array(
			z.object({
				category: z.string().min(1, '技能类别不能为空'),
				technologies: z.array(
					z.object({
						name: z.string().min(1, '技术名称不能为空'),
						level: z
							.enum(['beginner', 'intermediate', 'advanced', 'expert'])
							.optional(),
					}),
				),
			}),
		)
		.optional(),
	socialLinks: z
		.array(
			z.object({
				platform: z.enum([
					'GitHub',
					'LinkedIn',
					'Twitter',
					'Instagram',
					'YouTube',
					'Facebook',
					'Other',
				]),
				url: z.url('请输入有效的URL'),
				username: z.string().optional(),
			}),
		)
		.optional(),
})

type SiteProfileFormData = z.infer<typeof siteProfileSchema>

export function EditProfile() {
	const [open, setOpen] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		setValue,
		watch,
		control,
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
			slogans: [],
			skills: [],
			socialLinks: [],
		},
	})

	const {
		fields: sloganFields,
		append: appendSlogan,
		remove: removeSlogan,
	} = useFieldArray({
		control,
		name: 'slogans',
	})

	const {
		fields: skillFields,
		append: appendSkill,
		remove: removeSkill,
	} = useFieldArray({
		control,
		name: 'skills',
	})

	const {
		fields: socialLinkFields,
		append: appendSocialLink,
		remove: removeSocialLink,
	} = useFieldArray({
		control,
		name: 'socialLinks',
	})

	// Fetch current site profile when dialog opens
	useEffect(() => {
		if (open) {
			getSiteProfile()
				.then(({ profile }) => {
					if (profile) {
						setValue('name', profile.name || '')
						setValue('title', profile.title || '')
						setValue('bio', profile.bio || '')
						setValue('avatar', profile.avatar || '')
						setValue('location', profile.location || '')
						setValue('email', profile.email || '')
						setValue('website', profile.website || '')
						setValue('slogans', profile.slogans || [])
						setValue('skills', profile.skills || [])
						setValue('socialLinks', profile.socialLinks || [])
					}
				})
				.catch((error) => {
					console.error('Failed to fetch site profile:', error)
					toast.error('获取站点资料失败')
				})
		}
	}, [open, setValue])

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
				slogans: data.slogans || [],
				skills: data.skills || [],
				socialLinks: data.socialLinks || [],
			})
			toast.success('站点资料已更新')
			setOpen(false)
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
			<DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>编辑站点资料</DialogTitle>
					<DialogDescription className="sr-only">
						修改站点的基本信息和联系方式。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Tabs>
						<TabsList>
							<TabsTrigger value="base">Base</TabsTrigger>
							<TabsTrigger value="slogans">Slogans</TabsTrigger>
							<TabsTrigger value="skills">Skills</TabsTrigger>
							<TabsTrigger value="socialLinks">Social Links</TabsTrigger>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.name]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.title]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.bio]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.avatar]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.location]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.email]} />
											</InputGroupAddon>
										</InputGroup>
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
											<InputGroupAddon align="inline-end">
												<FieldError errors={[errors.website]} />
											</InputGroupAddon>
										</InputGroup>
									</FieldContent>
								</Field>
							</FieldGroup>
						</TabsContent>
						<TabsContent value="slogans">
							<div className="space-y-4">
								{sloganFields.map((field, index) => (
									<div key={field.id} className="flex flex-col gap-2">
										<Field>
											<FieldContent>
												<InputGroup>
													<InputGroupAddon>文本</InputGroupAddon>
													<InputGroupInput
														{...register(`slogans.${index}.text`)}
														placeholder="输入口号文本"
													/>
													<InputGroupAddon align="inline-end">
														<FieldError
															errors={[errors.slogans?.[index]?.text]}
														/>
													</InputGroupAddon>
												</InputGroup>
											</FieldContent>
										</Field>
										<div className="flex gap-2 items-center justify-center">
											<Field>
												<FieldContent>
													<InputGroup>
														<InputGroupAddon>字体大小</InputGroupAddon>
														<InputGroupInput
															{...register(`slogans.${index}.fontSize`)}
															placeholder="例如: 16px"
														/>
													</InputGroup>
													<FieldError
														errors={[errors.slogans?.[index]?.fontSize]}
													/>
												</FieldContent>
											</Field>
											<Field>
												<FieldContent>
													<InputGroup>
														<InputGroupAddon>颜色</InputGroupAddon>
														<InputGroupInput
															{...register(`slogans.${index}.color`)}
															placeholder="例如: #000000"
														/>
													</InputGroup>
													<FieldError
														errors={[errors.slogans?.[index]?.color]}
													/>
												</FieldContent>
											</Field>
											<Button
												variant="destructive"
												size="icon"
												className="rounded-full"
												onClick={() => removeSlogan(index)}>
												<XIcon />
											</Button>
										</div>
									</div>
								))}
								<Button
									onClick={() =>
										appendSlogan({ text: '', fontSize: '', color: '' })
									}>
									<PlusIcon />
									口号
								</Button>
							</div>
						</TabsContent>
						<TabsContent value="skills">
							<div className="space-y-6">
								{skillFields.map((field, skillIndex) => (
									<div
										key={field.id}
										className="border rounded-lg p-4 space-y-4">
										<div className="flex gap-2 items-center justify-center">
											<Field>
												<FieldContent>
													<InputGroup>
														<InputGroupAddon>类别</InputGroupAddon>
														<InputGroupInput
															{...register(`skills.${skillIndex}.category`)}
															placeholder="例如: 前端开发"
														/>
														<InputGroupAddon align="inline-end">
															<FieldError
																errors={[errors.skills?.[skillIndex]?.category]}
															/>
														</InputGroupAddon>
													</InputGroup>
												</FieldContent>
											</Field>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => removeSkill(skillIndex)}>
												删除类别
											</Button>
										</div>
										<div className="space-y-2">
											<h4 className="text-sm font-medium">技术栈</h4>
											{/* For simplicity, we'll use watch to get current technologies and render them */}
											{(watch(`skills.${skillIndex}.technologies`) || []).map(
												(
													tech: { name: string; level?: string },
													techIndex: number,
												) => (
													<div
														key={techIndex}
														className="flex gap-2 items-center justify-center ml-4">
														<Field>
															<FieldContent>
																<InputGroup>
																	<InputGroupAddon>技术名称</InputGroupAddon>
																	<InputGroupInput
																		{...register(
																			`skills.${skillIndex}.technologies.${techIndex}.name`,
																		)}
																		placeholder="例如: React"
																	/>
																	<InputGroupAddon align="inline-end">
																		<FieldError
																			errors={[
																				errors.skills?.[skillIndex]
																					?.technologies?.[techIndex]?.name,
																			]}
																		/>
																	</InputGroupAddon>
																</InputGroup>
															</FieldContent>
														</Field>
														<Field className="flex-1">
															<FieldContent>
																<Select
																	value={watch(
																		`skills.${skillIndex}.technologies.${techIndex}.level`,
																	)}
																	onValueChange={(value) =>
																		setValue(
																			`skills.${skillIndex}.technologies.${techIndex}.level`,
																			value as
																				| 'beginner'
																				| 'intermediate'
																				| 'advanced'
																				| 'expert',
																		)
																	}>
																	<SelectTrigger>
																		<SelectValue placeholder="选择熟练度" />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectGroup>
																			<SelectItem value="beginner">
																				初级
																			</SelectItem>
																			<SelectItem value="intermediate">
																				中级
																			</SelectItem>
																			<SelectItem value="advanced">
																				高级
																			</SelectItem>
																			<SelectItem value="expert">
																				专家
																			</SelectItem>
																		</SelectGroup>
																	</SelectContent>
																</Select>
																<FieldError
																	errors={[
																		errors.skills?.[skillIndex]?.technologies?.[
																			techIndex
																		]?.level,
																	]}
																/>
															</FieldContent>
														</Field>
														<Button
															variant="destructive"
															size="icon"
															className="rounded-full"
															onClick={() => {
																const currentTechnologies =
																	watch(`skills.${skillIndex}.technologies`) ||
																	[]
																const newTechnologies =
																	currentTechnologies.filter(
																		(
																			_: { name: string; level?: string },
																			i: number,
																		) => i !== techIndex,
																	)
																setValue(
																	`skills.${skillIndex}.technologies`,
																	newTechnologies,
																)
															}}>
															<XIcon className="size-4" />
														</Button>
													</div>
												),
											)}
											<Button
												size="sm"
												onClick={() => {
													const currentTechnologies =
														watch(`skills.${skillIndex}.technologies`) || []
													setValue(`skills.${skillIndex}.technologies`, [
														...currentTechnologies,
														{ name: '', level: undefined },
													])
												}}
												className="ml-4">
												<PlusIcon />
												技术
											</Button>
										</div>
									</div>
								))}
								<Button
									onClick={() =>
										appendSkill({ category: '', technologies: [] })
									}>
									<PlusIcon />
									技能类别
								</Button>
							</div>
						</TabsContent>
						<TabsContent value="socialLinks">
							<div className="space-y-4">
								{socialLinkFields.map((field, index) => (
									<div
										key={field.id}
										className="flex flex-col gap-2 justify-center">
										<div className="flex items-center justify-center gap-2">
											<Field className="flex-1">
												<FieldContent>
													<Select
														value={watch(`socialLinks.${index}.platform`)}
														onValueChange={(value) =>
															setValue(
																`socialLinks.${index}.platform`,
																value as
																	| 'GitHub'
																	| 'LinkedIn'
																	| 'Twitter'
																	| 'Instagram'
																	| 'YouTube'
																	| 'Facebook'
																	| 'Other',
															)
														}>
														<SelectTrigger>
															<SelectValue placeholder="选择平台" />
														</SelectTrigger>
														<SelectContent>
															<SelectGroup>
																<SelectItem value="GitHub">GitHub</SelectItem>
																<SelectItem value="LinkedIn">
																	LinkedIn
																</SelectItem>
																<SelectItem value="Twitter">Twitter</SelectItem>
																<SelectItem value="Instagram">
																	Instagram
																</SelectItem>
																<SelectItem value="YouTube">YouTube</SelectItem>
																<SelectItem value="Facebook">Facebook</SelectItem>
																<SelectItem value="Other">Other</SelectItem>
															</SelectGroup>
														</SelectContent>
													</Select>
													<FieldError
														errors={[errors.socialLinks?.[index]?.platform]}
													/>
												</FieldContent>
											</Field>
											<Field className="">
												<FieldContent>
													<InputGroup>
														<InputGroupAddon>用户名</InputGroupAddon>
														<InputGroupInput
															{...register(`socialLinks.${index}.username`)}
															placeholder="可选用户名"
														/>
													</InputGroup>
													<FieldError
														errors={[errors.socialLinks?.[index]?.username]}
													/>
												</FieldContent>
											</Field>
											<Button
												variant="destructive"
												size="icon"
												className="rounded-full"
												onClick={() => removeSocialLink(index)}>
												<XIcon />
											</Button>
										</div>
										<Field>
											<FieldContent>
												<InputGroup>
													<InputGroupAddon>URL</InputGroupAddon>
													<InputGroupInput
														type="url"
														{...register(`socialLinks.${index}.url`)}
														placeholder="输入链接地址"
													/>
													<InputGroupAddon align="inline-end">
														<FieldError
															errors={[errors.socialLinks?.[index]?.url]}
														/>
													</InputGroupAddon>
												</InputGroup>
											</FieldContent>
										</Field>
									</div>
								))}
								<Button
									onClick={() =>
										appendSocialLink({
											platform: 'GitHub',
											url: '',
											username: '',
										})
									}>
									<PlusIcon />
									社交链接
								</Button>
							</div>
						</TabsContent>
					</Tabs>
					<DialogFooter>
						{errors.root && <FieldError errors={[errors.root]} />}

						<Button type="submit" disabled={isSubmitting}>
							<SaveIcon />
							{isSubmitting ? '保存中...' : '保存更改'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
