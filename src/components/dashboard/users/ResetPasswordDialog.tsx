'use client'

import { KeyRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import type { User } from './UsersTable'

interface ResetPasswordDialogProps {
	user: User | null
	newPassword: string
	isResettingPassword: boolean
	onPasswordChange: (value: string) => void
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	onClose: () => void
}
export function ResetPasswordDialog({
	user,
	newPassword,
	isResettingPassword,
	onPasswordChange,
	onSubmit,
	onClose,
}: ResetPasswordDialogProps) {
	return (
		<>
			{/* 管理员重置密码 Dialog */}
			<Dialog
				open={Boolean(user)}
				onOpenChange={(open) => {
					if (!open) {
						onClose()
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>手动重置用户密码</DialogTitle>
						<DialogDescription>
							为用户{' '}
							<span className="font-semibold text-foreground">
								{user?.name} ({user?.email})
							</span>{' '}
							设置新密码。免邮件系统方案下，设置后请将新密码告知该用户。
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={onSubmit} className="space-y-4">
						<Field>
							<FieldLabel htmlFor="admin-new-password">新密码</FieldLabel>
							<InputGroup>
								<InputGroupAddon>
									<KeyRound className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									id="admin-new-password"
									type="password"
									placeholder="请输入至少 6 位新密码"
									value={newPassword}
									onChange={(e) => onPasswordChange(e.target.value)}
									autoFocus
									required
									minLength={6}
								/>
							</InputGroup>
						</Field>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									onClose()
								}}
							>
								取消
							</Button>
							<Button type="submit" disabled={isResettingPassword}>
								{isResettingPassword ? '重置中...' : '确认重置'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
