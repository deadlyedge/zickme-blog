import type { StatusType } from '@/types/content/post'

export const STATUS_BADGE_MAP: Record<
	StatusType,
	{
		label: string
		variant: 'default' | 'secondary' | 'outline' | 'destructive'
	}
> = {
	PUBLISHED: { label: '已发布', variant: 'default' },
	DRAFT: { label: '草稿', variant: 'secondary' },
	ARCHIVED: { label: '已归档', variant: 'outline' },
	PENDING: { label: '待审核', variant: 'outline' },
	SPAM: { label: '垃圾内容', variant: 'destructive' },
}
