# 想法


# 已完成 Todos

- 问题1/2：基本认可你的方案，publish时执行检查，发现问题中断发布，给出建议，应该默认检查所有内容或用户指定检查posts/gallery。并用语义明确的命令让用户可以快速重建结构（包括posts的frontmatter和gallery的结构yaml/album.yaml）
- 问题3/4/5：确认不需要保留兼容三方同步的内容，应移除历史残留。而且同时为了避免脚本竞争，我认为还应该暂时停用github/workflow，直到同步逻辑最终确认。
- 问题6：可暂时禁用snapshot功能，直到理清其具体逻辑
- 问题8/9/10：应该暂时停用github/workflow，直到同步逻辑最终确认。
- 