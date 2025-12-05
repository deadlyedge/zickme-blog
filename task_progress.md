# TypeScript 类型错误修复任务

## 问题分析
在 `src/lib/store/auth-slice.ts` 中的 `checkAuth` 方法存在类型不匹配错误：
- 类型定义要求返回 `Promise<void>`
- 实际实现返回了 `Promise<User | null>`

## 解决方案
修改 `checkAuth` 方法实现，移除返回值以匹配类型定义

## 任务步骤
- [x] 检查 authApi.getCurrentUser() 的返回类型 - 确认为 Promise<User | null>
- [ ] 修复 checkAuth 方法的类型错误 - 移除 return user 和 return null 语句
- [ ] 验证修复后的代码能正确编译
- [ ] 确保不影响现有的认证逻辑

## 当前状态
需要移除 checkAuth 方法中的两行 return 语句以匹配 Promise<void> 类型定义
