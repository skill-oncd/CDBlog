---
title: "Lyra-WarTower：为 Vibe Coding 设计的 UE5 多智能体开发框架 —— GameFeature + MCP + 21-Agent 网络"
date: 2026-08-06 15:00:00
tags:
  - Unreal
  - Lyra
  - GAS
  - GameFeature
  - MCP
  - Claude Code
  - AI-Assisted Development
  - Vibe Coding
categories:
  - Portfolio
encrypt: true
description: 基于 Lyra + Claude Code 构建的 21 智能体 UE5 开发网络。通过三层抽象模型（Concept→Order→REQ）、MCP 编辑器直连、双清单质量体系与流程 Bug 反馈闭环，探索 AI 辅助游戏开发的工程化边界。已产出完整的 Souls-like 战斗系统（6 GA + 5 AttributeSet）。
---

## 项目概览

| 项 | 内容 |
|---|------|
| **类型** | AI 辅助游戏开发基础设施 / 多智能体编排框架 |
| **引擎** | UE5.4+（已迁移至 5.6） |
| **核心框架** | Lyra（Experience + GameFeature + GAS + Enhanced Input） |
| **智能体数量** | 21 个专家子代理（9 执行层 + 6 知识层 + 6 Lyra 知识层） |
| **MCP 工具** | 23 个，覆盖资产/蓝图/GAS/动画/PIE/编译全流程 |
| **已产出内容** | 6 核心战斗 GA + 5 属性集 + 输入配置 + GameFeature 插件架构 |
| **开发周期** | 2026.07.13 — 至今（持续迭代） |

这是一个为 Vibe Coding 设计的 UE5 开发框架——不是传统意义上的游戏项目，而是一套让 AI 能可靠地参与 UE5 游戏开发的工程基础设施。它试图回答一个问题：当 AI 写游戏代码时，怎么保证架构正确、编译通过、资产就位、行为验收？

---

## 一、问题定义：Vibe Coding 在 UE5 中的三个断层

"Vibe Coding"——用自然语言描述意图，AI 生成代码——在小规模项目中已相当好用。但在 UE5 这种重度框架 + 编辑器资产 + 二进制蓝图混合的生态中，存在三个根本断层：

```
用户意图（自然语言）
    │
    ▼  ❌ 断层 1：意图 → 架构设计
    │     "加一个弹反" → 该不该创建 Character 子类？
    │     还是用 Component + GameFeatureAction？
    │
    ▼  ❌ 断层 2：代码 → 编辑器资产
    │     C++ 写完了，DataAsset 创建了吗？
    │     InputMappingContext 配置了吗？
    │     BP 壳设置了 IUnLuaInterface 吗？
    │
    ▼  ❌ 断层 3：资产 → 运行时验证
          编译过了 ≠ 能进 PIE
          进了 PIE ≠ 功能正确
          单人正确 ≠ 网络同步正确
```

Lyra-WarTower 的核心命题就是：用工程化手段填补这三个断层。

---

## 二、架构总览

### 2.1 整体拓扑

```
┌─────────────────────────────────────────────────────┐
│                    协调者（主 Claude）                  │
│  意图路由 → 级联调度 → 中断仲裁 → 质量门放行            │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
    ┌──────▼──────┐           ┌──────▼──────┐
    │  知识层 (6)  │           │  执行层 (9)  │
    │             │           │             │
    │ concept-*   │  ──REQ──▶ │ architect   │
    │ requirement │           │ gameplay    │
    │ archivist   │  ◀──归档── │ animation   │
    │ doc-writer  │           │ blueprint   │
    │             │           │ lua-module  │
    └─────────────┘           │ tools       │
                              │ build-verify│
    ┌─────────────┐           │ code-review │
    │ Lyra 知识层  │           │ debugger    │
    │    (6)      │           └──────┬──────┘
    │             │                  │
    │ qa-navigator│  ◀── 横向服务 ──┘
    │ cpp-advisor │       MCP 直连 UE Editor
    │ code-advisor│       23 工具：资产/蓝图/GAS
    │ cpp-writer  │       /动画/PIE/编译
    │ integrity   │
    │ gdd-writer  │
    └─────────────┘
```

### 2.2 三层抽象：从灵感到工单

借鉴软件工程中的需求层级，将游戏开发需求拆为三层：

```
Concept（GDC 演讲级）     Order/GDD（技术规格级）    REQ（工单级）
───────────────────     ──────────────────────    ──────────────
"要什么体验"             "用什么技术实现"           "具体改哪些文件/类"

"前期 DS3 立回体验，      体力是第一公民，          创建 UTowerStaminaSet
 后期 黑夜君临成型流派"    用 GAS Cost 机制消耗      继承 ULyraAttributeSet
                         体力，空精触发力竭 Tag     实现体力消耗/回复/力竭
                                                    检测，3 个 GE + 5 个
                          负责：concept-critic       委托回调
 负责：concept-writer
       concept-analyst                              负责：requirement-analyst
```

并且支持多对多关系：一个 Concept 可以产出多个 Order，多个 Concept 可以共享一个 Order。进度沿全链路向上聚合。

### 2.3 最小充分链路原则

并非所有任务都要走 Concept → Order → REQ → 实现 → 归档的全链。协调者根据用户意图做路由判断：

| 用户意图 | 入口 | 链路长度 |
|---------|------|---------|
| "加一个远程敌人" | concept-writer | 全链（重型） |
| "实现 REQ-0007" | architect → coders | 执行层 3-4 agent |
| "修崩溃" | debugger → coder | 执行层 2 agent |
| "改一行代码" | 对应 coder | 1 agent |
| "查看 ORDER-0002" | 协调者直接操作 | 0 agent |

只调用达成目标所必需的 agent，不强制走全链。

---

## 三、核心设计一：MCP 直连——让 AI 操作 UE Editor

这是整个框架最"硬核"的部分。通过 [Unreal-MCP](https://github.com/ChiR24/Unreal_mcp) 插件（v0.5.30），Claude Code 可以通过 HTTP/SSE 协议直接控制 UE Editor。

### 3.1 MCP 工具矩阵（23 工具）

| 域 | 工具 | 能力 |
|----|------|------|
| system_control | UBT 编译、控制台命令、Python 脚本、日志订阅 | 编译门 + 诊断 |
| control_editor | PIE 启动/停止、截图、相机控制 | 运行时验证 |
| manage_asset | 资产 CRUD、搜索、依赖分析 | 资产完整性检查 |
| manage_blueprint | BP 创建、编译、SCS 组件、UMG Widget | 编辑器自动化 |
| manage_gas | GA/GE/AttributeSet/Cue 创建配置 | GAS 资产配置 |
| manage_networking | Input Action/Mapping Context、Replication 配置 | 输入 + 网络 |
| inspect | Object/CDO 内省、属性读写、组件列表 | 验证 + 调试 |
| control_actor | Actor 生成/删除/Transform、物理 | PIE 场景操作 |
| animation_physics | AnimBP、Montage、BlendSpace、IK | 动画系统 |

### 3.2 MCP 分级使用策略

不是所有 MCP 工具都同等对待：

```
Level 1 — 资产验证（强制）
    build-verifier 编译通过后必须通过 MCP 检查资产完整性
    code-reviewer 必须先执行 MCP 资产验证门（阻断级）
    MCP 不可用时标记为 🔴阻断，而非跳过

Level 2 — 编辑器自动化（尽力）
    coder 优先通过 MCP 直接执行资产创建、BP 配置、Input 映射
    MCP 不可用时回退为 ✋手动清单
```

这个分级的核心思想：验证不允许降级，自动化允许回退。编译门和资产完整性检查是质量的最后防线，不能因为"编辑器没启动"就跳过。

---

## 四、核心设计二：双清单体系——编辑器配置 ≠ PIE 验证

传统 AI 辅助开发中，C++ 代码写完就认为"功能完成了"。但在 UE5 中，代码只是第一步。

设计了两份性质不同的清单，由不同 agent 负责产出和验证：

| | 编辑器配置前置清单 | PIE 运行时验收清单 |
|---|-------------------|-------------------|
| 性质 | 前置条件——不做则功能不存在 | 后置验证——确认行为正确 |
| 时机 | code-reviewer 审查前 | 编辑器配置完成后 |
| 内容 | DataAsset 创建、BP 壳、Input 映射、Details 面板配置 | 运行时行为、交互验证、多人同步 |
| 执行方式 | MCP 自动优先，不可用则 ✋手动 | MCP 辅助：截图/日志/属性检查 |
| 责任人 | 各 coder 产出 → build-verifier 初检 → code-reviewer 聚合 | code-reviewer 产出 → 用户执行 |

核心观察：把"让功能存在"和"让功能正确"分开，避免了"编译通过了但 PIE 进不去"的死循环。

---

## 五、核心设计三：流程 Bug 反馈闭环

这是框架中比较独特的机制——Bug 不仅是代码 bug，也包括流程 bug、架构决策 bug。

### 5.1 六条流程 Bug 实录（精选）

在短短两周的开发中，框架自身捕获并修复了 6 条流程级缺陷：

| Bug | 现象 | 根因 | 修复 |
|-----|------|------|------|
| PROC-BUG-0001 | Architect 未评估 Lyra 方案，直接创建 Character 子类 | Agent 定义缺少架构对齐约束 | architect 增加 BLOCKING 级「Lyra 架构对齐评估」节 |
| PROC-BUG-0002 | 430 行错误代码通过了 15 维审查 | Code-reviewer 维度缺少架构对齐检查 | 新增维度 0（阻断）：Lyra 架构对齐，扩展至 16 维 |
| PROC-BUG-0004 | 因 LYRAGAME_API 缺失误判，创建了 ~285 行不必要的平行类 | 混淆了"编辑器实例化"与"C++ 子类化" | 区分能力矩阵：MinimalAPI+UE_API virtual = 可子类化 |
| PROC-BUG-0005 | UTowerExperienceDefinition 是不必要的 C++ 子类 + 缺少 ActionSet 复用层 | 重演 LYRA-API 误判 + 不了解 ActionSet 机制 | 删除子类，改用 Lyra 原生 DataAsset + ActionSet |
| PROC-BUG-0006 | 误判 MinimalAPI 类不可跨模块子类化 | 对 UE 导出宏机制理解不完整 | 文档化 MinimalAPI 判定矩阵，修正 REQ-0005 |

### 5.2 反馈闭环设计

```
生产事故 → Bug 知识条目 → Agent 定义更新 → 规范文档更新
                                        │
                    ┌───────────────────┘
                    ▼
            下一次同类请求 → Agent 自动遵循新规则
```

每条流程 Bug 的修复都涉及两层变更：
1. Agent 定义层：修改 `.claude/agents/` 中的 agent prompt
2. 共享规范层：修改 `conventions.md` 中的编码约定

这保证了"同样的错误不会犯两次"——不是靠人记忆，而是靠 agent 定义形成硬约束。

---

## 六、已产出内容：Souls-like 战斗系统

框架在两周内产出的实际游戏内容：

### 6.1 战斗 GA（6 个）

| GA | 机制亮点 |
|----|---------|
| `UTowerAbility_Attack` | 轻攻击连段（Combo Window）+ 重攻击单发 + GAS 原生 Cost 体力消耗 |
| `UTowerAbility_Dodge` | MotionWarping 位移 + 0.15s 无敌帧 + ServerInitiated 网络模式 |
| `UTowerAbility_Block` | 按住持续消耗体力（StaminaDrainEffect）+ 伤害减免 GE |
| `UTowerAbility_Parry` | 窗口判定（0.1s-0.3s）+ 成功施加 RiposteReady Tag + 失败施加 Stunned |
| `UTowerAbility_Riposte` | 目标搜索 + MotionWarping 突进 + 3x 伤害 GE + Exclusive_Blocking |
| `UTowerAbility_TargetLock` | 锥形扫描 + 相机模式切换，LocalOnly / Independent |

### 6.2 属性集（5 个）

`UTowerStaminaSet` / `UTowerHealthSet` / `UTowerManaSet` / `UTowerBuildStatsSet` / 复用 `ULyraHealthSet`

其中 `UTowerBuildStatsSet` 实现了 Souls-like 的 6 属性成长体系（力/敏/智/信 + 经验等级），带保底曲线 + Bonus GE + 6 委托回调。

### 6.3 输入配置

10 个 InputAction + IMC + `ULyraInputConfig` 完整链路，零新 C++ 类——全部复用 Lyra 原生框架。

---

## 七、踩过的坑

### 7.1 UE5.6 迁移：4 轮迭代

从 UE5.4 迁移到 5.6 时遇到的编译问题：
- `CppCompileWarningSettings` Build.cs API 弃用
- UHT 裸指针强制 `TObjectPtr`
- `TChooseClass` 移除 → 改用 `std::conditional_t`
- UnLua 全量替换至 v2.3.6

### 7.2 GameFeature 资产搜索路径

PIE 启动时 `GameFeatureData is missing`。根因是引擎的 GF 搜索路径有首选/备选两级——`/Game/` 和 `/Plugins/GameFeatures/<PluginName>/`。解决：在备选路径创建同名 DataAsset，而非修改引擎配置。

### 7.3 `ULyraExperienceDefinition` 的 API 导出

Lyra 核心类没有 `LYRAGAME_API` 导出宏，意味着不能从外部 GameFeature 插件的 C++ 代码中继承它。正确做法是用蓝图 DataAsset 实例化，而非 C++ 子类化。

### 7.4 MinimalAPI + UE_API virtual 的微妙语义

`MinimalAPI` 不等于"不可用"。关键区别：
- `MinimalAPI` + `virtual` + `UE_API` = 可以从外部 DLL 跨模块子类化
- 无 API 导出 = 只能在本模块使用

这个误判导致了一次 ~150 行不必要代码的教训（PROC-BUG-0006）。

### 7.5 架构审查盲区

比较有收获的一个教训：代码审查的 15 个维度全过了，但架构选型是错的。430 行 `ATowerCharacter` 通过了所有审查标准——代码风格、GC 安全、网络同步、GAS 模式——但本质上是错的，因为在 Lyra 体系中，创建 Character C++ 子类是反模式。这暴露了"审查维度完备 ≠ 审查结论正确"，需要在维度之上加一层架构级硬约束。

---

## 八、架构可改进点

| 问题 | 现状 | 改进方向 |
|------|------|---------|
| Agent 上下文重复加载 | 每个 Agent 启动时都需读取 conventions.md（~200 行） | Claude Code 的 prompt caching 可缓解，但跨 agent 不共享。考虑将高频规范编译为子提示词模板 |
| 编辑器自动化成功率 | MCP 工具覆盖率高，但部分操作（如复杂的 DataAsset 字段填充）仍需手动 | 持续向 MCP 上游贡献工具增强；编写项目级 MCP 包装脚本 |
| PIE 阻塞链 | REQ-0005/0006/0008 的 PIE 验收因动画系统未完成而阻塞 | 引入 Mock 策略——在动画就位前用数据化替代方案验证核心逻辑 |
| 多 REQ 并发时的文件冲突 | 当前靠 architect 预分配文件所有权 | 引入 worktree 隔离 + 合并仲裁 agent |
| Lyra 版本同步 | 当前手动跟踪 LyraStarterGame 更新 | 自动化 diff 检测 + 影响分析（可利用 GitNexus 技能） |
| 测试覆盖 | 当前依赖 PIE 手动验收，无自动化测试 | 引入 Gauntlet 功能测试 + GAS 单元测试框架 |

---

> 这个项目的核心收获是：AI 辅助开发的瓶颈不在 AI 能力，而在工程流程设计。21 个 Agent 写出能编译的 C++ 不难，难的是写出"符合 Lyra 架构、资产就位、网络同步安全、PIE 可验收"的完整功能。填这个坑的不是更强的模型，而是流程约束、MCP 自动化、双清单体系和 Bug 反馈闭环。

---

*Lyra-WarTower 持续迭代中。如果你对 AI 辅助 UE5 开发、多智能体编排、或 MCP 编辑器自动化感兴趣，欢迎交流。*
