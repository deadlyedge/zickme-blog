# 当前架构文档入口

本目录只存放当前架构规范、治理记录和可复现审计说明；历史阶段计划仍位于 [`../develop-plans/`](../develop-plans/)，不应被当作当前实现规范。

## 当前规范

- [`../architecture-reduction.md`](../architecture-reduction.md)：Git-first 单向发布和恢复边界的正式架构规范。
- [`stage11-deprecated-fields-and-migration-audit.md`](stage11-deprecated-fields-and-migration-audit.md)：Stage 11 废弃字段、Migration 文件链和生产状态限制的只读审计。
- [`stage11-implementation-summary.md`](stage11-implementation-summary.md)：Stage 11 当前已完成范围、验证证据和未完成的生产准入事项。

## 当前实施计划

- [`../develop-plans/development-plan-stage11-architecture-governance.md`](../develop-plans/development-plan-stage11-architecture-governance.md)：Stage 11 计划与验收清单。
- [`../develop-plans/development-plan-stage12-production-safety-and-migration.md`](../develop-plans/development-plan-stage12-production-safety-and-migration.md)：Stage 12 生产安全、删除闭环与 Migration 执行计划。

## 可复现审计

```bash
# 只检查仓库 migration 文件与 Drizzle journal，不连接数据库
bun run db:audit-migrations
```

该命令不能证明生产环境已应用哪些 migration。生产状态必须分别读取目标环境的 journal、schema、备份和回滚窗口后再决定是否压缩或删除。