# 用户名和密码修改功能优化任务 ✅ 已完成

## 需求 ✅ 已完成
将"修改密码"按钮功能改为直接点击用户名连接，打开 dialog 可供修改用户名和密码。

## 修改内容 ✅ 全部完成

### 1. 更新 Auth Modal ✅
- [x] **修改 AuthModal 组件** (`src/components/auth/AuthModal.tsx`)
  - ✅ 移除独立的"修改密码"选项卡
  - ✅ 添加"修改账户信息"功能到用户已登录状态
  - ✅ 包含用户名修改和密码修改表单
  - ✅ 智能显示：未登录时显示登录/注册，已登录时显示profile编辑

### 2. 更新 Comments 区域 ✅
- [x] **修改 CommentsSection 组件** (`src/components/comments/CommentsSection.tsx`)
  - ✅ 将"修改密码"按钮改为点击用户名
  - ✅ 用户名作为可点击链接打开账户编辑 dialog
  - ✅ 简化界面：只有用户名链接和登出按钮

### 3. 更新状态管理 ✅
- [x] **更新 Auth Slice** (`src/lib/store/auth-slice.ts`)
  - ✅ 添加 updateProfile action（修改用户名和密码）
  - ✅ 更新 authModalView 类型包含 'profile'
  - ✅ 移除 updatePassword 独立功能

### 4. 更新 API 工具 ✅
- [x] **完善 auth.ts** (`src/lib/auth.ts`)
  - ✅ 添加完整的 updateProfile API 调用
  - ✅ 处理用户名和密码的联合更新
  - ✅ 支持可选密码修改
  - ✅ 完整的错误处理和类型定义

### 5. API 方法实现 ✅
- [x] **updateProfile 方法完成**
  - ✅ 接收 username, currentPassword, newPassword 参数
  - ✅ 调用 `/update-profile` 端点
  - ✅ 返回更新后的用户信息
  - ✅ 完整的类型安全和错误处理

## 具体实现步骤 ✅ 全部完成
1. ✅ 更新类型定义，添加 profile 修改选项卡
2. ✅ 修改 AuthModal，移除密码修改独立选项卡
3. ✅ 更新 CommentsSection，用户名可点击
4. ✅ 更新 API 和状态管理逻辑
5. ✅ 完善 updateProfile API 方法
6. ✅ 测试功能完整性

## 功能特性
- ✅ **用户体验优化**：点击用户名直接编辑账户信息
- ✅ **表单验证**：完整的前端验证逻辑
- ✅ **密码安全**：修改密码需要验证当前密码
- ✅ **可选密码**：支持只修改用户名不修改密码
- ✅ **响应式设计**：使用 shadcn 组件保持一致性
- ✅ **状态管理**：完整的 Zustand 状态管理集成
- ✅ **API 集成**：完整的后端 API 调用支持

## 技术实现细节

### API 端点
- `POST /api/users/update-profile` - 更新用户信息
- 请求体：`{ username: string, currentPassword: string, newPassword?: string }`
- 响应：更新后的用户对象

### 前端验证
- 用户名：3-20字符，字母数字下划线
- 当前密码：必填，用于身份验证
- 新密码：可选，最少6位字符
- 密码确认：新密码和确认密码必须一致

### 状态管理
- 使用 Zustand 管理全局认证状态
- 支持 loading、error 状态管理
- 自动同步用户信息更新

## 最终结果
现在用户可以：
1. 未登录时看到"登录"和"注册"按钮
2. 已登录时看到可点击的用户名和"登出"按钮
3. 点击用户名打开账户设置 dialog
4. 在 dialog 中修改用户名和可选的密码
5. 修改成功后自动关闭 dialog 并更新界面
6. 完整的错误处理和用户反馈

## 🔧 后端需要实现的 API
为了完整功能，后端需要实现以下端点：
- `POST /api/users/update-profile` - 更新用户信息（用户名和密码）
