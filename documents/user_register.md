我已经安装了shadcn组件dialog input-group tabs。实现一个轻量级的 Auth Modal，直接嵌入在 Comments 区域。

### 优化后的开发方案

#### 1. 后端调整 (无需变动)
继续使用之前敲定的方案：
-   `Users` 集合开放 `create` 权限（公开注册）。
-   `read` 权限需登录。

#### 2. Auth Modal 组件 (`src/components/auth/AuthModal.tsx`) - **核心新增**
创建一个弹窗组件，包含三个选项卡/状态：
-   **登录 (Login)**: Email + Password。
-   **注册 (Register)**: Username + Email + Password + Confirm Password。
-   **修改密码 (Change Password)**: 旧密码 + 新密码（仅登录状态下可用）。

这个 Modal 将由 Zustand Store 全局控制显示/隐藏。

#### 3. Auth Slice (`src/lib/store/auth-slice.ts`)
-   **State**: `user`, `isAuthenticated`, `isAuthModalOpen`, `authModalView` (login/register/update-password)。
-   **Actions**:
    -   `login`, `register`, `logout`, `updatePassword` (调用 API)。
    -   `openAuthModal(view)`, `closeAuthModal` (控制 UI)。
    -   `checkAuth` (初始化检查)。

#### 4. CommentsSection 集成 (`src/components/comments/CommentsSection.tsx`)
修改标题区域：
-   **未登录**: "Comments" 旁显示一个小巧的 "Login / Join" 按钮，点击调用 `openAuthModal('login')`。
-   **已登录**: 显示 "Logged in as [User]"，点击弹出下拉或 Modal，可选择 "Change Password" 或 "Logout"。
-   `CommentForm` 只对 `isAuthenticated` 为 `true` 的用户启用，否则显示遮罩或提示“请先登录”。

#### 5. 布局集成 (`src/app/(frontend)/layout.tsx`)
-   引入 `<AuthModal />` 并放置在根层级（避免 z-index 问题），确保它能在任何页面（只要用到 Comments 的地方）被唤起。

