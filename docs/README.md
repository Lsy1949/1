# 项目文档索引

| 文档 | 内容 | 主要读者 |
|---|---|---|
| [technical-features.md](./technical-features.md) | **技术功能文档**：系统架构、路由与访问控制、多租户、数据访问、实时通道、i18n/无障碍、功能模块总表、Mock、构建部署、已知偏差 | 接手开发、前后端联调、验收 |
| [functional-review.md](./functional-review.md) | **功能与技术说明（评审版）**：定位与范围、核心技术、访问与权限、多租户与品牌、接口与实时、多语言与无障碍、模块规则、演示与联调、部署、功能边界、验收要点（不含代码） | 产品、设计、测试、业务方、验收 |
| [api-contract.md](./api-contract.md) | 接口契约（由 mock 反向导出）：认证、租户、内容、业务模块、SignalR、部署变量 | 后端、联调 |
| [design-language.md](./design-language.md) | UI/交互规范：动效、无障碍、颜色/阴影/圆角/间距、偏差清单 | 前端、设计 |
| [migration-guide.md](./migration-guide.md) | Vue 3 / Element Plus → React 18 / Ant Design 迁移对照与等价性权衡 | 迁移评审 |
| [handover.md](./handover.md) | 待办与注意事项 | 接手人 |

## 维护约定

1. **代码是唯一权威**：文档与实现冲突时以代码为准，并在同一次提交内回改文档。
2. 功能层面的事实写进 `technical-features.md`；接口字段写进 `api-contract.md`；视觉与交互约束写进 `design-language.md`，三者不互相复制。
3. 新增页面、接口、租户时的同步清单见 `technical-features.md` 附录 A。
