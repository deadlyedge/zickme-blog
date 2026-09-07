import * as readline from 'node:readline'
import { hashPassword } from 'better-auth/crypto'
import { prisma } from '../src/lib/prisma'

interface ResetOptions {
	email?: string
	password?: string
}

function parseArgs(): ResetOptions {
	const args = process.argv.slice(2)
	const options: ResetOptions = {}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		if (arg === '--email' || arg === '-e') {
			options.email = args[++i]
		} else if (arg === '--password' || arg === '-p') {
			options.password = args[++i]
		} else if (arg.startsWith('--email=')) {
			options.email = arg.split('=')[1]
		} else if (arg.startsWith('--password=')) {
			options.password = arg.split('=')[1]
		}
	}

	return options
}

async function prompt(question: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close()
			resolve(answer.trim())
		})
	})
}

async function main() {
	console.log('🔧 管理员密码重置工具 (CLI)\n')

	const args = parseArgs()
	let email = args.email
	let password = args.password

	if (!email) {
		email = await prompt('请输入管理员邮箱: ')
	}

	if (!email) {
		console.error('❌ 邮箱不能为空')
		process.exit(1)
	}

	// 查找用户
	const user = await prisma.user.findUnique({
		where: { email },
	})

	if (!user) {
		console.error(`❌ 未找到邮箱为 "${email}" 的用户`)
		process.exit(1)
	}

	if (user.role !== 'ADMIN') {
		console.warn(
			`⚠️ 提示: 用户 "${email}" 当前角色为 ${user.role}，不是 ADMIN。`,
		)
		const promote = await prompt('是否将其同时提升为 ADMIN 角色? (y/N): ')
		if (promote.toLowerCase() === 'y') {
			await prisma.user.update({
				where: { id: user.id },
				data: { role: 'ADMIN' },
			})
			console.log('✅ 已提升为 ADMIN 角色')
		}
	}

	if (!password) {
		password = await prompt('请输入新密码 (至少 6 位): ')
	}

	if (!password || password.length < 6) {
		console.error('❌ 密码长度必须至少为 6 位')
		process.exit(1)
	}

	console.log('⏳ 正在加密密码并更新凭据...')

	// 使用 better-auth 的哈希工具
	const hashedPassword = await hashPassword(password)

	// 查找或创建 credential account
	const existingAccount = await prisma.account.findFirst({
		where: {
			userId: user.id,
			providerId: 'credential',
		},
	})

	if (existingAccount) {
		await prisma.account.update({
			where: { id: existingAccount.id },
			data: {
				password: hashedPassword,
				updatedAt: new Date(),
			},
		})
	} else {
		// 如果此前没有 credential account，新建一个
		await prisma.account.create({
			data: {
				id: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
				accountId: user.id,
				providerId: 'credential',
				userId: user.id,
				password: hashedPassword,
				updatedAt: new Date(),
			},
		})
	}

	// 清理该用户现有的 session，确保重新使用新密码登录
	await prisma.session.deleteMany({
		where: { userId: user.id },
	})

	console.log(`\n🎉 管理员 [${email}] 密码重置成功！已撤销所有现有登录会话。`)
}

main()
	.catch((error) => {
		console.error('❌ 重置失败:', error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
