# 故障排查

以下条目按"现象 → 检查顺序 → 根因与修法"组织，均来自本项目的实际踩坑记录。

## 页面显示 Key 而非文案

检查顺序：

1. 硬刷新（Ctrl+F5）。字典 JSON 更新后，dev server 或浏览器可能仍持有旧快照
2. 重启 `pnpm dev`。新装依赖后 Vite 需要重建预构建缓存
3. 控制台依次执行诊断命令，定位问题层：

```js
i18next.language                                            // 当前语言，应为 'zh-CN' 等
i18next.store.data['zh-CN'].translation.main.plug           // 字典是否真实加载
i18next.services.languageMatcher.toResolveHierarchy('zh-CN') // 语言解析链，必须返回非空数组
```

三条命令的结果指向不同故障层：language 异常是检测问题；store.data 缺 Key 是字典加载问题；toResolveHierarchy 返回 `[]` 则是下面记录的配置事故。

### 已知事故：nonExplicitSupportedLngs

症状最隐蔽的一类：`i18next.language` 正常、`store.data` 完整、`hasLoadedNamespace` 通过、控制台无任何报错，但全站 `t()` 一律返回 Key 本身。

根因：init 配置了 `nonExplicitSupportedLngs: true` 时，i18next 的语言匹配会先把 `zh-CN` 裁剪成基础码 `zh` 再与 `supportedLngs` 比对，而本项目 `supportedLngs` 只登记完整语言码，`zh` 永远匹配失败，导致 `toResolveHierarchy` 返回空数组——翻译查找循环一次都不执行。语言检测与资源加载走的是另一条匹配路径，所以其余检查全部正常。

修复：init 配置中不使用该选项。正确配置（`src/i18n/index.ts` 当前状态，勿回退）：

```ts
.init({
  resources,
  supportedLngs: SUPPORTED_LANGUAGES,  // ['zh-CN', 'en-US', 'hu-HU', 'id-ID']
  load: 'currentOnly',
  fallbackLng: 'zh-CN',
  // 注意：这里不要添加 nonExplicitSupportedLngs: true
  // ...
})
```

浏览器上报短码（如 `zh`、`en`）的场景由 i18next 的 `getBestMatchFromCodes` 反向匹配完整码，配合 `normalizeLanguage` 前缀归一化兜底，功能不受影响。

### HMR 与字典的时序

批量改造场景下，组件代码先于字典合并时，热更新会短暂显示 Key。JSON 文件变更会触发 Vite 整页 reload 重新执行 i18n 初始化；若未触发，手动刷新即可。这类现象在改动落盘后自然消失，不是代码缺陷。

## 切换语言后某段文字不更新

根因：该文案在模块顶层调用了 `t()`。顶层常量在模块加载时求值一次，语言切换后不会重新求值，HMR 热更新同理。

修法：移入组件体内并用 `useMemo` 包裹（依赖数组包含 `t`），或改为接收 `t` 的 getter 函数 `(t: TFunction) => [...]`。项目内已有改造范例，全局搜索 `useMemo` 配合 `t` 即可参考。

## IDE 报 Key 缺失，但字典里存在

i18n Ally 之类插件的缓存陈旧条目：Problems 面板的条目在对应文件被重新评估前不会自动消失。处理：点开该 problem 触发重新评估，或 Reload Window。

权威校验永远是编译器：`pnpm exec tsc --noEmit` 通过即表示四语 Key 对齐（keyParityCheck 门禁）。运行时验证某 Key 是否加载：

```js
i18next.store.data['en-US'].translation.page.home.systemName
```

返回译文即正常，返回 undefined 才是真缺失。

## tsc 突然出现大量 t() 报错

十有八九是某份 JSON 语法损坏（多余或缺失逗号、引号未闭合）。JSON 解析失败会使 `typeof zhCN` 推导坍塌，所有 `t()` 调用连锁报错。看 tsc 输出的第一条错误——它通常直接指向损坏的 JSON 文件与行号，修复后其余报错连带消失。

## 新增语言后界面无变化

按 [使用指南](./02-usage-guide.md) 的五步清单逐项检查，最常见的遗漏是 `ANTD_LOCALE` 映射（Antd 组件仍是旧语言）和 `normalizeLanguage` 分支（浏览器短码无法归一化，永远回退 zh-CN）。
