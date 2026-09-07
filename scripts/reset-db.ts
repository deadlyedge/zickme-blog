import * as readline from 'node:readline'
import { sql } from 'drizzle-orm'
import { db } from '../src/db'

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
	const isForce =
		process.argv.includes('--force') || process.argv.includes('-f')

	console.log('⚠️  警告: 即将重置数据库！')
	console.log(
		'此操作将清空所有数据表（文章、标签、评论、用户、会话、个人资料等）。\n',
	)

	if (!isForce) {
		const confirmation = await prompt(
			'确认要清空并重置数据库吗？请输入 "yes" 继续: ',
		)
		if (confirmation.toLowerCase() !== 'yes') {
			console.log('❌ 操作已取消。')
			process.exit(0)
		}
	}

	console.log('⏳ 正在重置数据库表数据...')

	try {
		// 清空所有业务与认证表，并重置外键级联
		await db.execute(sql`
			TRUNCATE TABLE 
				"_PostToTag",
				"Comment",
				"Post",
				"tag",
				"siteProfile",
				"session",
				"account",
				"verification",
				"user"
			CASCADE;
		`)

		console.log('✅ 数据库重置成功！所有表数据已清空。')
		console.log('💡 提示: 您可以运行以下命令重新同步文章:')
		console.log('   bun run sync')
	} catch (error) {
		console.error('❌ 重置数据库失败:', error)
		process.exit(1)
	} finally {
		process.exit(0)
	}
}

main().catch((err) => {
	console.error('❌ 脚本异常退出:', err)
	process.exit(1)
})
