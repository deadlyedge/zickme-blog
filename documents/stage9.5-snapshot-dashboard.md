# Stage 9.5：Dashboard 数据库快照和恢复

## 1. 已交付模块

| 模块 | 文件 | 职责 |
| :--- | :--- | :--- |
| Snapshot 类型 | `src/lib/snapshot/snapshot-types.ts` | 白名单 payload、摘要和版本 |
| Snapshot 安全 | `src/lib/snapshot/snapshot-safety.ts` | 规范化、SHA-256、payload 校验 |
| Repository | `src/lib/snapshot/snapshot-repository.ts` | 查询快照、可恢复数量和允许表导出 |
| Service | `src/lib/snapshot/snapshot-service.ts` | 创建、PRE_RESTORE 和事务恢复 |
| ADMIN Actions | `src/lib/actions/snapshot-admin.ts` | 权限、Zod、DTO、删除和路径刷新 |
| Dashboard | `/dashboard/snapshots` | 创建、查看、软删除、二次确认恢复 |

## 2. 快照内容

默认保存：

```text
Post
tag
_PostToTag
Gallery
GalleryImage
siteProfile
```

管理员勾选后才保存 `Comment`。以下内容始终排除：

```text
user / session / account / verification
SyncRun / SyncLog / lockKey / lockExpiresAt
Cloudinary 二进制、原始 Gallery 输入和认证 Secret
```

payload 在保存前递归规范化日期和对象键顺序，并生成 SHA-256 hash。恢复前会验证 schemaVersion 和 hash，防止损坏或篡改的快照进入恢复流程。

## 3. 恢复安全

恢复要求：

- ADMIN Session；
- 合法 UUID；
- `READY` 或 `RESTORED` 状态；
- 当前 Schema Version；
- payload hash 匹配；
- 页面输入完整快照名称二次确认。

恢复在单个数据库事务中执行。事务开始时先创建 `PRE_RESTORE` 快照，然后标记目标快照 `RESTORING`，清理并写回允许的业务表，成功后标记 `RESTORED`。任一步失败都会回滚业务恢复和保护快照事务。

认证表、运行记录、锁和 Cloudinary 不受恢复影响。数据库恢复不会回滚 Markdown、`album.yaml` 或代码，页面明确提示下一次内容同步可能覆盖恢复结果。

## 4. 删除规则

- 删除是软删除，状态改为 `DELETED`；
- `PRE_RESTORE` 保护快照不能删除；
- 至少保留一个 `READY` 或 `RESTORED` 快照；
- 删除快照不会触碰 Cloudinary；
- 只有 ADMIN Action 可以执行删除。

## 5. 已知边界

当前 Dashboard 使用安全摘要 DTO，不向浏览器返回 payload 正文。评论恢复需要在创建和恢复时分别明确选择；默认恢复不写入评论。快照恢复只恢复数据库运行时副本，不执行 Git 回滚、内容源回写或真实同步。