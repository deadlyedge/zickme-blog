# 想法


# 已完成 Todos

- [x] Dashboard 管理数据库快照，由管理员决定将整站运行时内容恢复到某个快照；恢复前自动创建 PRE_RESTORE 保护快照。
- [x] `bun run sync` 未指定 scope 时默认尝试同步所有 content 内容（等价于 `--scope all`）。