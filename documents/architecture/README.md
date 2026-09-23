# 当前架构文档入口

本目录只存放当前架构规范、治理记录和可复现审计说明；历史阶段计划仍位于 [`../old-plans/`](../old-plans/)，不应被当作当前实现规范。

## 当前规范

- [`../old-plans/architecture-reduction.md`](../old-plans/architecture-reduction.md)：Git-first 单向发布和恢复边界的历史架构规范；当前实现以本目录中的代码结构与治理文档为准。
- [`stage11-deprecated-fields-and-migration-audit.md`](stage11-deprecated-fields-and-migration-audit.md)：Stage 11 废弃字段、Migration 文件链和生产状态限制的只读审计。
- [`stage11-implementation-summary.md`](stage11-implementation-summary.md)：Stage 11 当前已完成范围、验证证据和未完成的生产准入事项。
- [`current-code-structure-summary.md`](current-code-structure-summary.md)：当前代码结构、已完成清理、兼容边界和后续优化方向。
- [`readability-refactor-plan.md`](readability-refactor-plan.md)：Dashboard 文章页、Publish 服务及内容检查脚本的可读性重构计划。
- [`stage12-environment-inventory.md`](stage12-environment-inventory.md)：个人 Blog 单库状态和 reset/publish 操作边界。

## 当前实施计划

- [`../development-plan-stage13-home-gallery-experience.md`](../development-plan-stage13-home-gallery-experience.md)：首页 Gallery 与混合热门内容体验计划。
- [`../old-plans/development-plan-stage11-architecture-governance.md`](../old-plans/development-plan-stage11-architecture-governance.md)：Stage 11 计划与验收清单。
- [`../old-plans/development-plan-stage12-production-safety-and-migration.md`](../old-plans/development-plan-stage12-production-safety-and-migration.md)：Stage 12 生产安全、删除闭环与 Migration 执行计划。

## 数据库与运行时边界

当前项目按单库、可重置的个人 Blog 维护。数据库需要初始化或升级时使用 `bun run db:migrate`，网站内容清空使用 `bun run db:reset`，两者职责不同。Migration 文件和 Drizzle journal 属于数据库迁移机制，不再提供额外的独立 audit 命令。