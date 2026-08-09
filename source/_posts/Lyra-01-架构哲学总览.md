---
title: "【技术探索】Lyra 框架拆解（一）：架构哲学总览 —— 薄 Actor + 厚 Component + GameFeature 插件化"
date: 2026-08-06 16:00:00
tags:
  - Lyra
  - Unreal
  - GameFeature
  - ModularGameplay
  - Architecture
categories:
  - Portfolio
  - Lyra 框架拆解
description: 拆解 Lyra 的四层架构哲学：Experience 配方层、GameFeature 原料层、Component 能力层、InitState 状态机协调层。深度分析"为什么这样做"，而非"代码长什么样"。
---

## 系列导航

| 篇 | 主题 |
|----|------|
| **一** | **架构哲学总览（本文）** |
| 二 | [Experience 系统：玩法配方表](/2026/08/06/Lyra-02-Experience系统) |
| 三 | [Character 组件体系与 InitState 状态机](/2026/08/06/Lyra-03-Character组件体系) |
| 四 | [GAS 集成层](/2026/08/06/Lyra-04-GAS集成层) |
| 五 | [Equipment & Inventory](/2026/08/06/Lyra-05-Equipment-Inventory) |
| 六 | [Input 系统](/2026/08/06/Lyra-06-Input系统) |
| 七 | [网络同步框架](/2026/08/06/Lyra-07-网络同步) |
| 八 | [UI 系统](/2026/08/06/Lyra-08-UI系统) |

---

## 一句话理解 Lyra

Lyra 不是"一个游戏"，而是一套"做游戏的游戏"——它是 Epic 在 UE5 时代给模块化多人游戏的参考答案。它的核心命题是：

> 如何在不为每个游戏模式写一个 `AGameMode` 子类的前提下，让同一个 `ALyraCharacter` 在射击模式、探索模式、TopDown 模式下呈现完全不同的能力组合？

Lyra 的答案是四个字：**数据驱动注入**。C++ 提供能力框架，DataAsset 定义具体配方，GameFeature 插件负责物理隔离与按需加载。

---

## 一，四层架构全景图

```
┌──────────────────────────────────────────────┐
│        Layer 0: Experience（配方层）           │
│  "这场游戏玩什么？"                              │
│  ULyraExperienceDefinition (DataAsset)         │
│  → 激活哪些 GameFeature？                       │
│  → 执行哪些初始化动作？                          │
│  → 生成什么 Pawn？                              │
└──────────────────┬───────────────────────────┘
                   │ GameFeaturesToEnable
┌──────────────────▼───────────────────────────┐
│       Layer 1: GameFeature（原料层）            │
│  物理隔离的玩法容器（独立 .uplugin）             │
│  ShooterCore / TopDownArena / TowerChallenge  │
│  → C++ 模块（可选）+ 蓝图资产 + 配置            │
└──────────────────┬───────────────────────────┘
                   │ GameFeatureAction
┌──────────────────▼───────────────────────────┐
│      Layer 2: Component（能力层）              │
│  "薄 Actor + 厚 Component"                     │
│  ALyraCharacter (~500行) = 事件转发器           │
│  → PawnExtensionComponent：状态机指挥官         │
│  → HeroComponent：输入 + 相机代理               │
│  → HealthComponent：血量 + 死亡状态机           │
│  → CameraComponent：CameraMode 栈              │
└──────────────────┬───────────────────────────┘
                   │ 能力通过 AbilitySet 授予
┌──────────────────▼───────────────────────────┐
│      Layer 3: GAS / Input / UI / Net          │
│  被注入的具体游戏能力                           │
│  → AbilitySet：GA + GE + AttributeSet 打包     │
│  → InputConfig：InputAction → GameplayTag     │
│  → UIExtension：GameplayTag 驱动 Widget 注入   │
│  → ReplicationGraph：节点化复制策略             │
└──────────────────────────────────────────────┘
```

一个值得注意的设计决策：每一层只知道下一层的接口，不知道下一层的具体实现。Experience 不知道 ShooterCore 的 C++ 类长什么样；ALyraCharacter 不知道有哪些 GameFeature 会给它注入 Component。这就是 Lyra 实现"同一套 C++ 代码支持多种游戏模式"的根本原因。

---

## 二，薄 Actor + 厚 Component：最核心的架构决策

传统 UE 项目中，Character 类往往是"万恶之源"——血量管理、武器切换、技能逻辑、输入处理、相机控制全部堆在一个类里，轻松突破 3000 行。

Lyra 的做法是把 Actor 变成一个"插槽"：

```cpp
// ALyraCharacter 构造函数 —— 这就是它的全部"主动行为"
PawnExtComp = CreateDefaultSubobject<ULyraPawnExtensionComponent>("PawnExtension");
HealthComp  = CreateDefaultSubobject<ULyraHealthComponent>("HealthComponent");
CameraComp  = CreateDefaultSubobject<ULyraCameraComponent>("CameraComponent");
```

注意什么不在这里：`ULyraHeroComponent`（输入绑定 + 相机代理）不在 Character 的 C++ 构造函数中——它在蓝图 `B_Hero_ShooterMannequin` 中添加，甚至可以通过 GameFeatureAction 动态注入。

这意味着不同的 GameFeature 可以给同一个 Character 类注入不同的 Component 组合，而 Character 代码完全不需要修改。

### 第二层解耦：GameFrameworkComponentManager 的 ExtensionHandler

更进一步，GameFeatureAction 通过 `AddExtensionHandler(ActorClass, Delegate)` 机制，在运行时检测到特定类型 Actor 创建时动态注入 Component：

```
GameFeatureAction 注册 Handler("ALyraCharacter", SpawnDelegate)
         │
         ▼
GameFrameworkComponentManager 检测到 ALyraCharacter 生成
         │
         ▼
SpawnDelegate 执行 → 给这个 Actor 动态添加 Component + 授予 AbilitySet
```

ALyraCharacter 从头到尾不知道是哪个插件给它加了什么能力。

---

## 三，Experience：配方表 vs GameMode 子类

### 传统方案的问题

如果你要为同一个项目做三个模式（团队死斗、控制点、竞速），传统做法是：

```
AGameModeBase
  ├─ AGameMode_TDM      （配置 TDM 专属 Pawn/HUD/规则）
  ├─ AGameMode_CP       （配置 CP 专属 Pawn/HUD/规则）
  └─ AGameMode_Race     （配置 Race 专属 Pawn/HUD/规则）
```

每个 GameMode 子类硬编码自己的 PawnClass、HUDClass、PlayerControllerClass。三个模式还行，十个模式呢？而且 TDM 和 CP 共享同样的武器系统，但需要不同的 HUD 和计分规则——继承体系无法优雅地表达这种"部分共享、部分差异"。

### Lyra 的方案：配方表模式

```cpp
// ULyraExperienceDefinition — 一张 DataAsset 解决一切
GameFeaturesToEnable: ["ShooterCore", "ShooterMaps"]  // 激活什么插件
DefaultPawnData: HeroData_ShooterGame                  // 默认 Pawn 配置
Actions: [AddAbilities, AddInputBinding, AddWidgets]   // 初始化动作
ActionSets: [LAS_ShooterGame_SharedInput]              // 可复用动作组合
```

一个新的游戏模式 = 一张新的 Experience DataAsset。不需要写一行 C++。

Lyra 提供了三个 Experience 示例：
- `B_Experience_Elimination` → TDM 模式
- `B_Experience_ControlPoint` → 控制点模式
- `B_Experience_Perf` → 性能测试模式

它们使用的是同一个 `ALyraGameMode` 类，差异全部在 DataAsset 和 GameFeature 层面。

---

## 四，InitState：用 GameplayTag 替代 BeginPlay 时序

这是 Lyra 最巧妙也最容易被忽视的设计。在多组件 + 网络复制的环境下，`BeginPlay` 的调用顺序是不可靠的：

- 服务器上 Component A 先于 Component B 初始化
- 客户端上 Component B 可能先复制到，Component A 还没创建
- 某个 Component 依赖 PawnData 设置完毕 → 但 PawnData 在服务器上通过 RPC 设置，客户端何时收到不确定

Lyra 的解决方案是用 GameplayTag 驱动的显式状态机替代隐式时序依赖：

```
InitState_Spawned           ← Actor 已生成，Component 已注册
        │
        ▼  (条件：PawnData 已设置 + Controller 就绪)
InitState_DataAvailable     ← 数据已就绪，可以开始读取配置
        │
        ▼  (条件：所有 Feature 都达到 DataAvailable)
InitState_DataInitialized   ← 所有 Feature 的数据都就绪了
        │
        ▼  (无条件通过)
InitState_GameplayReady     ← 开始正常游戏逻辑
```

每个 Component 实现 `IGameFrameworkInitStateInterface`，声明自己的 Feature 名称和当前状态。`ULyraPawnExtensionComponent` 作为"指挥"，监听所有 Feature 的状态变化，在条件满足时推进整体状态链。

为什么用 GameplayTag 而非枚举？因为 GameFeature 插件可以定义自己的中间状态（如 `InitState_DLC_AssetsLoaded`），无需修改引擎代码。

---

## 五，GameFeature 插件：物理隔离的玩法容器

GameFeature 是 Lyra 实现"按需加载"和"团队并行开发"的物理基础。每个 GameFeature 是一个独立的 `.uplugin`：

```
ShooterCore/
  ├── ShooterCore.uplugin   ← ExplicitlyLoaded: true, EnabledByDefault: false
  ├── Source/               ← C++ 模块（可选，ShooterCore 有 15 个类）
  ├── Content/              ← 蓝图资产（武器/角色/HUD/输入）
  └── Config/Tags/          ← 插件级 GameplayTag 定义
```

### 加载链路

```
WorldSettings → Experience.GameFeaturesToEnable
  → ULyraExperienceManagerComponent (LoadingGameFeatures 阶段)
    → UGameFeaturesSubsystem::LoadAndActivateGameFeaturePlugin()
      → 插件状态：Registered → Loaded → Active
```

关键配置：
- `ExplicitlyLoaded: true` — 不随引擎自动加载，由 Experience 显式触发
- `EnabledByDefault: false` — 游戏启动时不加载，按需激活
- `BuiltInInitialFeatureState: "Registered"` — 已注册但未激活（DLL 未加载，资产未扫描）

### 插件分层

```
Layer 0: LyraGame (C++ 核心框架，非 GameFeature)
Layer 1: ShooterCore (C++ + Content)  ← 射击基础
Layer 2: ShooterExplorer, ShooterMaps (纯 Content)  ← 依赖 ShooterCore
Layer 3: ShooterTests (C++ + Content)  ← 自动化测试
独立游戏: TopDownArena, TowerChallenge  ← 不依赖 ShooterCore
```

TowerChallenge（我们的 ARPG）与 ShooterCore 完全独立——两者都依赖 LyraGame 核心框架，但彼此无依赖关系。

---

## 六，C++ 职责边界：一个判断框架

Lyra 不是"把所有东西都写成 C++"——正相反，它大量使用蓝图。ShooterCore 只有 15 个 C++ 类，TopDownArena 只有 4 个。判断一个功能是否该写成 C++ 的参考维度：

| 问题 | 是 → C++ | 否 → 蓝图/DataAsset |
|------|---------|---------------------|
| 需要每帧运行？ | 瞄准辅助、移动计算 | 技能激活逻辑 |
| 需要自定义网络复制？ | AttributeSet、GameState 组件 | 技能冷却 UI |
| 是 LyraGame 提供的扩展点？ | GameplayMessageProcessor、InputModifier | 自定义游戏模式逻辑 |

一个值得注意的约束：Lyra 的扩展点是 `UGameplayMessageProcessor`、`UGameStateComponent`、`UInputModifier` 这类专门的基类，而非 `AGameMode`、`ACharacter`、`AGameState` 这些核心 Actor。为这些框架类创建 C++ 子类在 Lyra 体系中通常是反模式。

---

## 七，Lyra 的"不变量"清单

在深入研究各个子系统之前，先记住 Lyra 框架中那些从不改变的东西：

1. 同一个 `ALyraGameMode` — 不按模式子类化
2. 同一个 `ALyraCharacter` — 不按角色类型子类化
3. 数据驱动注入 — 能力不硬编码在 Actor 构造函数中
4. GameplayTag 中介 — Input → Tag → GAS，不直接引用 InputAction
5. 组合优于继承 — Component + GameFeatureAction，不用 C++ 继承链表达玩法差异
6. InitState 状态机 — 不用 `BeginPlay` 时序假设替代显式状态推进

理解这些不变量，就理解了 Lyra 一半的设计意图。

---

> **下一篇**：[Experience 系统：玩法配方表](/2026/08/06/Lyra-02-Experience系统) — 深入拆解 `ULyraExperienceDefinition` 如何用一张 DataAsset 替代 GameMode 子类，以及 7 阶段加载状态机的完整运转机制。
