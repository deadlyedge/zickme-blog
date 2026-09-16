# Stage 12 单库状态记录

> 记录日期：2026-09-14
>
> 适用范围：个人 Blog 的本地开发工作区 + 一个可重置的实际数据库。
>
> 状态：不建立测试/预发布/多生产环境矩阵。当前记录仓库状态和实际数据库操作边界，不伪造数据库已执行结果。

## 1. 当前事实

- [x] Git `content/` 是唯一人工内容源。
- [x] `reset-db` 只清空运行时数据，不执行 migration、不修改 schema。
- [x] 当前正式 schema baseline 为 `drizzle/0000_stage12_baseline.sql`。
- [ ] 当前实际数据库已应用 baseline。
- [ ] 当前实际数据库已完成一次 reset 后的 Post/Gallery publish。

## 2. 当前数据库操作约定

### 清空网站内容

```bash
bun run db:reset -- --confirm-production-reset
bun run publish -- --scope all --no-delete
```

### 初始化或升级 schema

```bash
bun run db:migrate
```

数据库可重置，因此不为不存在的环境设计兼容 migration 链。若未来数据库不可重建，再单独补充备份和回滚方案。

## 3. 可选灾难恢复记录

灾难恢复不是当前 Stage 12 的完成阻塞项。未来确有需要时再记录：

- 数据库备份时间和恢复方式；
- Git commit/tag；
- Cloudinary 原始媒体备份或保留策略；
- 恢复失败时数据库、Git、Cloudinary 的边界。

Snapshot 只能保护数据库运行时副本，不能恢复 Git 内容或 Cloudinary 原始媒体。

## 4. 结论

当前不执行“四类环境”盘点，也不把环境矩阵作为个人 Blog 的架构要求。后续重点是：删除不再使用的字段、保持 reset/publish 简单可重复，并在需要时再增加灾难恢复能力。