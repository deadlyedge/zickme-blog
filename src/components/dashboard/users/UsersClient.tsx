'use client'

import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { deleteComment, toggleCommentSpam } from '@/lib/actions/comments-admin'
import {
	getUsersList,
	resetUserPasswordByAdmin,
	toggleUserBan,
} from '@/lib/actions/users-admin'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { type User, UsersTable } from './UsersTable'

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([])
	const [loading, setLoading] = useState(true)
	const [actionLoading, setActionLoading] = useState<string | null>(null)

	// 重置密码弹窗状态
	const [resetPasswordTargetUser, setResetPasswordTargetUser] =
		useState<User | null>(null)
	const [newPassword, setNewPassword] = useState('')
	const [isResettingPassword, setIsResettingPassword] = useState(false)

	useEffect(() => {
		const loadUsers = async () => {
			try {
				setLoading(true)
				const usersData = await getUsersList()
				setUsers(usersData)
			} catch (error) {
				console.error('Failed to load users:', error)
				toast.error('加载用户列表失败')
			} finally {
				setLoading(false)
			}
		}
		loadUsers()
	}, [])

	const handleToggleBan = async (userId: string, newBanned: boolean) => {
		try {
			setActionLoading(userId)
			await toggleUserBan(userId, newBanned)
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, banned: newBanned } : user,
				),
			)
			toast.success(newBanned ? '用户已封禁' : '用户已解封')
		} catch (error) {
			console.error('Failed to toggle user ban:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleToggleCommentStatus = async (
		commentId: string,
		isSpam: boolean,
	) => {
		try {
			setActionLoading(commentId)
			await toggleCommentSpam(commentId, isSpam)
			setUsers(
				users.map((user) => ({
					...user,
					comments: user.comments.map((comment) =>
						comment.id === commentId
							? { ...comment, status: isSpam ? 'SPAM' : 'PUBLISHED' }
							: comment,
					),
				})),
			)
			toast.success(
				isSpam ? '评论已标记为垃圾信息' : '评论已取消标记为垃圾信息',
			)
		} catch (error) {
			console.error('Failed to toggle comment status:', error)
			toast.error('操作失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleDeleteComment = async (commentId: string) => {
		try {
			setActionLoading(commentId)
			await deleteComment(commentId)
			setUsers(
				users.map((user) => ({
					...user,
					comments: user.comments.map((comment) =>
						comment.id === commentId
							? { ...comment, content: '[已删除]' }
							: comment,
					),
				})),
			)
			toast.success('评论已删除')
		} catch (error) {
			console.error('Failed to delete comment:', error)
			toast.error('删除评论失败')
		} finally {
			setActionLoading(null)
		}
	}

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!resetPasswordTargetUser) return

		if (!newPassword || newPassword.length < 6) {
			toast.error('新密码长度不能少于 6 位')
			return
		}

		try {
			setIsResettingPassword(true)
			const res = await resetUserPasswordByAdmin({
				userId: resetPasswordTargetUser.id,
				newPassword,
			})

			if (res.ok) {
				toast.success(`已成功重置用户 [${resetPasswordTargetUser.name}] 的密码`)
				setResetPasswordTargetUser(null)
				setNewPassword('')
			} else {
				toast.error(res.error || '重置密码失败')
			}
		} catch (error) {
			console.error('Failed to reset password:', error)
			toast.error('重置密码失败')
		} finally {
			setIsResettingPassword(false)
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto p-4 sm:p-6 py-8">
				<div className="flex items-center justify-center p-12 text-muted-foreground">
					<div className="text-sm">正在加载用户列表...</div>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto p-4 sm:p-6 py-8 space-y-6 max-w-7xl">
			{/* 页面头部 */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
						<Users className="h-6 w-6 text-primary" />
						用户与权限管理
					</h1>
					<p className="text-sm text-muted-foreground">
						管理全站注册用户账户、手动重置密码及读者评论内容治理
					</p>
				</div>
				<Badge
					variant="secondary"
					className="text-xs font-mono self-start sm:self-auto"
				>
					共 {users.length} 位注册读者
				</Badge>
			</div>

			<UsersTable
				users={users}
				actionLoading={actionLoading}
				onToggleBan={handleToggleBan}
				onToggleCommentStatus={handleToggleCommentStatus}
				onDeleteComment={handleDeleteComment}
				onOpenResetPassword={(user) => {
					setResetPasswordTargetUser(user)
					setNewPassword('')
				}}
			/>

			<ResetPasswordDialog
				user={resetPasswordTargetUser}
				newPassword={newPassword}
				isResettingPassword={isResettingPassword}
				onPasswordChange={setNewPassword}
				onSubmit={handleResetPassword}
				onClose={() => {
					setResetPasswordTargetUser(null)
					setNewPassword('')
				}}
			/>
		</div>
	)
}
