---
title: "【技术探索】Lyra 框架拆解（二）：Experience 系统 —— 玩法配方表"
date: 2026-08-10 13:00:00
tags:
  - Lyra
  - Unreal
  - Experience
  - GameFeature
  - DataAsset
  - ModularGameplay
categories:
  - Portfolio
  - Lyra 框架拆解
description: 深度拆解 Lyra Experience 系统的三层结构（配方-原料-料理步骤）、7 阶段加载状态机、三级委托优先级、PIE 多会话 FILO 引用计数仲裁，以及为什么一张 DataAsset 能替代所有 GameMode 子类。
---

## 系列导航

| 篇 | 主题 |
|----|------|
| 一 | [架构哲学总览](/2026/08/06/Lyra-01-架构哲学总览) |
| **二** | **Experience 系统（本文）** |
| 三 | [Character 组件体系与 InitState 状态机](/2026/08/06/Lyra-03-Character组件体系) |
| 四 | [GAS 集成层](/2026/08/06/Lyra-04-GAS集成层) |
| 五 | [Equipment & Inventory](/2026/08/06/Lyra-05-Equipment-Inventory) |
| 六 | [Input 系统](/2026/08/06/Lyra-06-Input系统) |
| 七 | [网络同步框架](/2026/08/06/Lyra-07-网络同步) |
| 八 | [UI 系统](/2026/08/06/Lyra-08-UI系统) |

---

## 一句话

Experience 是一张"玩法配方表"——它用一个 DataAsset 回答了"这场游戏玩什么"：激活哪些 GameFeature 插件、执行哪些初始化动作、玩家用什么样的 Pawn。

---

## 一，问题：GameMode 子类为何不够

在 Standard UE 中，为不同模式创建不同的 `AGameModeBase` 子类是标准做法：

```cpp
// 传统方案：每增加一个模式 = 一个新类
AGameModeBase
  ├── AGameMode_TDM        → PawnClass = B_Hero_TDM, HUDClass = B_HUD_TDM
  ├── AGameMode_CP         → PawnClass = B_Hero_CP,  HUDClass = B_HUD_CP
  └── AGameMode_Race       → PawnClass = B_Hero_Race, HUDClass = B_HUD_Race
```

三个模式看着还行，但扩展一下就暴露问题：

1. **C++ 类爆炸**：十个模式 = 十个 GameMode 子类，即使差异只在配置层面
2. **GameFeature 激活时机失控**：所有插件在游戏启动时加载，内存中堆着不用的代码和资产
3. **配置分散**：Pawn 配置、能力授予、输入绑定、UI 注册分散在多个子系统，无统一入口
4. **初始化顺序脆弱**：子系统隐式依赖彼此的初始化状态，竞态条件难以排查
5. **PIE 多会话仲裁**：编辑器并行运行多个 PIE 时，全局 GameFeature 状态冲突

Lyra 用 **一张 DataAsset + 一个状态机** 替代了这套继承体系。

---

## 二，`ULyraExperienceDefinition`：配方表的结构

```cpp
// 这就是 Lyra 中所有游戏模式的"唯一真相来源"
ULyraExperienceDefinition : UPrimaryDataAsset
{
    // 1. 激活哪些 GameFeature 插件（原料清单）
    TArray<FString> GameFeaturesToEnable;   // ["ShooterCore", "ShooterMaps"]
    
    // 2. 默认 Pawn 配置（玩家角色配方）
    TObjectPtr<ULyraPawnData> DefaultPawnData;
    
    // 3. 初始化动作列表（料理步骤）
    TArray<UGameFeatureAction*> Actions;     // [AddAbilities, AddInputBinding, AddWidgets...]
    
    // 4. 可复用的动作组合（预制菜包）
    TArray<ULyraExperienceActionSet*> ActionSets;  // [LAS_SharedInput, LAS_StandardHUD...]
};
```

### 三层隐喻

```
Experience ≈ 配方表 ("这场游戏玩什么")
    │
    ├── GameFeaturesToEnable ≈ 原料 ("需要哪些插件")
    │
    ├── Actions + ActionSets ≈ 料理步骤 ("按什么顺序做什么")
    │
    └── DefaultPawnData ≈ 主菜配置 ("玩家使用什么角色")
```

### ActionSet：可复用组合

`ULyraExperienceActionSet` 是 Lyra 的"预制菜"机制——它是一组 Action + GameFeature 的组合，可以在不同 Experience 间复用：

```
LAS_ShooterGame_SharedInput    → 所有射击模式共享的输入绑定
LAS_ShooterGame_StandardComponents → 所有射击模式共享的通用组件
LAS_ShooterGame_StandardHUD    → 所有射击模式共享的 HUD 布局
```

ShooterCore 使用三个共享 ActionSet + 模式专属 Action 的组合方式，避免了`AddAbilities` / `AddInputBinding` / `AddWidgets` 在每个 Experience 中重复配置。

---

## 三，7 阶段加载状态机

Experience 的加载不是"一把梭"——它有一个精心设计的异步状态机，确保每个阶段的依赖就绪后才继续：

```
Unloaded
  │  SetCurrentExperience()
  ▼
Loading                           ← 通过 AssetManager 加载 Experience DataAsset
  │  OnExperienceLoadComplete()
  ▼
LoadingGameFeatures               ← 异步激活所有 GameFeature 插件
  │  所有插件 LoadAndActivate 完成
  ▼
LoadingChaosTestingDelay          ← 仅测试：插入随机延迟模拟网络波动
  │  OnExperienceFullLoadCompleted()
  ▼
ExecutingActions                  ← 按序执行所有 Action 的三阶段回调
  │  所有 Action 执行完毕
  ▼
Loaded ◀───────────────────────── 广播三级委托，游戏正式开始
  │  EndPlay / 切换 Experience
  ▼
Deactivating                      ← 反向执行 Action 反注册 + GameFeature 卸载
  │
  ▼
Unloaded
```

### 为什么分这么细？

**分阶段 = 可观测 + 可插拔**。每个阶段有明确的入口条件、出口条件和失败处理。如果你要加一个"加载 DLC 资产"的步骤，在 `LoadingGameFeatures` 和 `ExecutingActions` 之间插入一个阶段即可，无需修改其他阶段。

---

## 四，三级委托优先级：解决初始化隐式依赖

Loaded 阶段广播的不是一个委托，而是**三级优先级委托**：

```
OnExperienceLoaded_HighPriority   ← 队伍创建组件（玩家依赖 TeamID）
        │
        ▼
OnExperienceLoaded                ← ALyraGameMode::OnExperienceLoaded (RestartPlayer)
                                   ← ALyraPlayerState::OnExperienceLoaded (设置 PawnData)
        │
        ▼
OnExperienceLoaded_LowPriority    ← 画质/音效等非关键设置
```

这解决了一个实际问题：`RestartPlayer()` 生成 Pawn 时，`PlayerState` 可能需要查询 TeamID。如果队伍创建和 Pawn 生成同时触发，顺序不确定就会导致竞态条件。三级优先级让"先创建队伍，再生成玩家"成为确定性行为。

---

## 五，Client/Server Bundle 分离

在 `StartExperienceLoad()` 中，根据 NetMode 加载不同的 Asset Bundle：

```cpp
// 客户端和服务器加载不同的资产集
TArray<FName> Bundles;
Bundles.Add("Equipped");            // 两方都加载
if (NetMode == NM_DedicatedServer)
    Bundles.Add("Server");          // 服务器专属
else
    Bundles.Add("Client");          // 客户端专属（UI 纹理、音效等）
```

专用服务器不会加载 UI 纹理、音频文件、特效材质——显著减少内存占用。

---

## 六，PIE 多会话 FILO 引用计数：被低估的设计

编辑器同时运行两个 PIE 会话会发生什么？如果两个会话都加载了 ShooterCore，关闭一个就卸载 ShooterCore 会崩掉另一个。

Lyra 的解决方案是 `ULyraExperienceManager`（EngineSubsystem）：

```
PIE Session A 加载 ShooterCore → RefCount++
PIE Session B 加载 ShooterCore → RefCount++
PIE Session A 关闭 → RefCount--  (不为0，不卸载)
PIE Session B 关闭 → RefCount--  (为0，卸载)
```

**FILO（First In Last Out）+ 引用计数**——简单但有效地解决了全局单例插件在 PIE 多会话下的仲裁问题。

---

## 七，三个 ShooterCore Experience 对比

Lyra 提供了三个具体的 Experience 定义，可以从它们看出"配方表模式"的实际威力：

| | B_Elimination | B_ControlPoint | B_Perf |
|---|-------------|--------------|--------|
| **GameFeatures** | ShooterCore + ShooterMaps | ShooterCore + ShooterMaps | ShooterCore + ShooterMaps |
| **PawnData** | HeroData_ShooterGame | HeroData_ShooterGame | HeroData_ShooterGame (简化) |
| **ActionSets** | SharedInput + StandardComponents + StandardHUD | SharedInput + StandardComponents + StandardHUD | SharedInput + StandardComponents |
| **专属Actions** | TDM 计分 + 淘汰UI | 控制点占领 + CP UI | 性能统计 |
| **Map** | L_Convolution_Blockout | L_Convolution_Blockout | L_Convolution_PerfWorld |

它们共享**完全相同的** `ALyraGameMode` 和 `ALyraCharacter` C++ 类。TDM 和控制点之间的差异全部在 DataAsset 和蓝图层面解决。

---

## 八，ARPG 落地要点

对于 TowerChallenge（我们的 ARPG 项目），Experience 层的配置有一些值得关注的点：

1. `DefaultGame.ini` 的 AssetManager 扫描路径：确保 `/TowerChallenge/Experiences` 在 `LyraExperienceDefinition` 的扫描列表中
2. ActionSet 复用策略：将通用系统（输入绑定、基础 HUD）打包为 ActionSet，模式专属逻辑放 Experience 自身 Actions
3. GameFeature 按需加载：塔层数/难度对应的内容放独立 GameFeature，高层才激活
4. PawnData 覆盖：不同职业/爬塔阶段的 PawnData 可通过 Experience 或运行时覆盖

---

> **下一篇**：[Character 组件体系与 InitState 状态机](/2026/08/06/Lyra-03-Character组件体系) — 拆解 "薄 Actor + 厚 Component + 状态机协调" 的三位一体架构，以及从 Experience 加载到 GameplayReady 的完整 9 阶段时间线。
