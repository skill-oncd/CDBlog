---
title: "Lyra 框架拆解（七）：网络同步框架 —— Iris + ReplicationGraph + FastShared 路径"
date: 2026-08-06 19:00:00
tags:
  - Lyra
  - Unreal
  - Networking
  - ReplicationGraph
  - Iris
  - FFastArraySerializer
categories:
  - Lyra 框架拆解
description: 拆解 Lyra 的四层网络同步体系——Iris 传输层、ReplicationGraph 六节点路由、SharedRepMovement 压缩、VerbMessage 消息系统——以及"分层解耦 + 默认禁用"的设计哲学。
---

## 系列导航

| 篇 | 主题 |
|----|------|
| 一 | [架构哲学总览](/2026/08/06/Lyra-01-架构哲学总览) |
| 二 | [Experience 系统](/2026/08/06/Lyra-02-Experience系统) |
| 三 | [Character 组件体系](/2026/08/06/Lyra-03-Character组件体系) |
| 四 | [GAS 集成层](/2026/08/06/Lyra-04-GAS集成层) |
| 五 | [Equipment & Inventory](/2026/08/06/Lyra-05-Equipment-Inventory) |
| 六 | [Input 系统](/2026/08/06/Lyra-06-Input系统) |
| **七** | **网络同步框架（本文）** |
| 八 | [UI 系统](/2026/08/06/Lyra-08-UI系统) |

---

## 一句话

Lyra 的网络同步架构不是"用一套方案解决所有问题"——它构建了**四层分层协作体系**，从底层的 Iris 序列化到上层的 VerbMessage 消息广播，每一层解决一个粒度的同步需求。最关键的设计决策：**ReplicationGraph 默认禁用**——先跑起来，性能瓶颈出现时再逐层启用优化。

---

## 一，五层同步架构

```
Gameplay 层:  UPROPERTY(Replicated) / FFastArray / RPC
   ↓          基础同步原语 —— 简单的 float/HUD 走属性，数组走 FastArray，一次性事件走 RPC
消息层:       FLyraVerbMessage（FFastArray + GameplayMessageSubsystem）
   ↓          跨系统的轻量事件广播（击杀广播、助攻消息、控制点占领）
压缩层:       FSharedRepMovement / FLyraReplicatedAcceleration
   ↓          移动数据共享——多个客户端观察同一个角色时，共享序列化结果
LOD 层:       ULyraSignificanceManager
   ↓          基于重要性动态调整复制频率（占位，框架已注册但未完成实现）
路由层:       ULyraReplicationGraph / Iris ObjectReplicationBridge
   ↓          按 Actor 类型分派到不同复制节点 —— 每个连接只收到"相关"的数据
Iris 传输层:   过滤 → 优先级排序 → 序列化 → Delta 压缩 → 带宽分配
```

**核心原则：每一层可以独立替换或禁用。** 这是 Lyra 最务实的网络设计决策——不是"给你一套完美但必须全用的系统"，而是"给你一套可逐层启用的工具集"。

---

## 二，Iris 与 ReplicationGraph 的分工

### Iris：下一代复制系统

Iris 是 UE5 新的底层复制框架（替代旧的 `UNetDriver` 复制管线），在 `LyraGame.Build.cs` 中通过一行宏启用：

```cpp
SetupIrisSupport(Target);
```

Iris 负责**怎么复制**：序列化格式选择、过滤算法、优先级计算、Delta 压缩、带宽分配。通过 `ObjectReplicationBridgeConfig` 按类指定过滤策略：

```cpp
// 按类指定过滤方式
FilterConfigs = [
    { Class = ALyraCharacter,    DynamicFilterName = "Spatial" },   // 空间距离过滤
    { Class = AWorldSettings,    DynamicFilterName = "NotRouted" }, // 不复制
    { Class = AGameState,        DynamicFilterName = "None" },      // 不过滤，全连接
];
```

### ReplicationGraph：自定义节点体系

ReplicationGraph 负责**复制什么**：哪些 Actor 对哪些连接是相关的。它定义了 6 种节点类型：

| 节点 | Actor 类型 | 策略 |
|------|-----------|------|
| **GridSpatialization2D** | 大部分 Gameplay Actor | 空间网格——只复制到"附近"的连接 |
| **AlwaysRelevant_ForConnection** | PlayerController + ViewTarget | 始终复制到拥有者 |
| **PlayerStateFrequencyLimiter** | PlayerState | 限制更新频率，降低带宽 |
| **ActorList** | ALyraCharacter | 独立列表，配合 FastShared 路径使用 |
| **TearOff** | 销毁的 Actor | 延迟清理，确保客户端收到销毁前的最后状态 |
| **FrequencyBuckets** | 低优先级 Actor | 分频复制——远距离 Actor 以更低频率更新 |

### 关键设计：ReplicationGraph 默认禁用

```cpp
bDisableReplicationGraph = true;  // 默认不走 ReplicationGraph
```

当 ReplicationGraph 禁用时，Iris 的 `ObjectReplicationBridgeConfig` 接管相关性过滤。这是 Lyra 的"先跑起来，优化再说"哲学的体现——小项目用 Iris 默认过滤足够，大项目再接入 ReplicationGraph 做精细路由。

---

## 三，FastShared 路径：独立带宽 + 共享序列化

ReplicationGraph 一个重要优化是 **FastShared 路径**——专门为移动数据设计：

```
ALyraCharacter 移动数据:
  常规路径:    每个连接独立序列化 + 独立发送
  带宽:        10 kB/s × N 个连接
  
  FastShared 路径: 序列化一次 → 广播给所有相关连接
  带宽:        10 kB/s × 1 次序列化
```

`ALyraCharacter` 通过 `FLyraReplicatedAcceleration` 结构体走这条路径——加速度数据从 12 字节压缩到 3 字节（75% 节省），且所有观察同一个角色的客户端共享同一份序列化结果。

**这对大逃杀/Battle Royale 场景至关重要**——一个角色可能被 30+ 个客户端同时观察，每条连接单独复制移动数据会吃掉所有上行带宽。

---

## 四，FSharedRepMovement：移动压缩详解

传统的 `FRepMovement` 结构通过 `ReplicatedMovement` 复制——包含 Location(12 bytes) + Rotation(12 bytes) + Velocity(12 bytes) + 额外数据 ≈ 50+ bytes。

Lyra 的 `FSharedRepMovement` 使用以下优化：

1. **量化位置**：世界坐标通过网格对齐降低精度 → 减少 bit 数
2. **加速度压缩**：`FLyraReplicatedAcceleration` 从 12 bytes → 3 bytes（量化为 256 级方向 + 精度缩放）
3. **Delta 压缩**：只发送相对于上一帧的变化，而非完整值
4. **独立带宽预算**：移动复制使用独立的带宽限制（而非与其他属性竞争）

---

## 五，FLyraVerbMessage：轻量事件广播

传统 RPC 是"一对一"（Server→OwningClient）或"一对多"（NetMulticast），但有些游戏事件需要**更灵活的订阅模型**：

```
击杀事件（Elimination.Message）:
  谁需要知道？
    → 击杀者 UI（显示击杀提示）
    → 被击杀者 UI（显示死亡画面）
    → 记分板（更新排名）
    → 助攻处理器（检测助攻）
    → 荣誉系统（检查连杀成就）
```

`FLyraVerbMessage` 提供了一条**双通道架构**：

1. **FFastArray 复制通道**：`FVerbMessageArray` 使用 `FFastArraySerializer` → 服务器上有新消息时增量复制到所有客户端
2. **GameplayMessageSubsystem 分发通道**：客户端收到消息后通过 `UGameplayMessageSubsystem` 广播 → 任何感兴趣的 Subsystem 自行订阅

**消息的生产者和消费者完全解耦**——ShooterCore 的 Elimination 消息可以被 ShooterExplorer 的 UI 订阅，双方互不知道对方存在。这是 Lyra 在 Gameplay 层实现的最大粒度的模块化通信。

---

## 六，FFastArraySerializer：结构化数据复制的基石

Lyra 中几乎所有的结构化列表数据都使用 `FFastArraySerializer`：

| 使用处 | 数据结构 | 特点 |
|--------|---------|------|
| **Inventory** | `FLyraInventoryList` | 增量更新 + SubObject 注册 |
| **Equipment** | `FLyraEquipmentList` | 装备列表的原子增删 |
| **VerbMessage** | `FVerbMessageArray` | 消息队列的自动回收 |
| **GameplayTag Stack** | Tag 堆叠计数 | StackCount 变化即复制 |

`FFastArraySerializer` 的核心优势：
- **增量复制**：只复制变化了的 Entry，不复制整个数组
- **客户端回调**：`PreReplicatedRemove` + `PostReplicatedAdd` + `PostReplicatedChange`——客户端在数组变化时收到明确通知
- **SubObject 支持**：通过 `RegisteredSubObject` 实现嵌套 UObject 的复制依赖

---

## 七，SignificanceManager：预留的优化层

`ULyraSignificanceManager` 已经注册在 `DefaultEngine.ini` 中，但 `RegisterObject()` 的实现被注释掉了（代码中有 `@TODO` 标记）。它的理论协作路径是：

```
ReplicationGraph::GetSignificance(Obj)
  → SignificanceManager::GetSignificance(Obj)
    → 返回 SignificanceValue（0-255）
      → ReplicationGraph 据此调整复制频率甚至完全跳过
```

**Lyra 的设计风格**：基建先到位（类已创建、已注册），调优留给项目开发者。"你知道有这个优化点，框架已经给你留好了位置"——比"框架没考虑这个场景，你需要从头实现"好得多。

---

> **下一篇（终篇）**：[UI 系统](/2026/08/06/Lyra-08-UI系统) — 拆解 Lyra 的四层 UI 架构：CommonUI → CommonGame → UIExtension → LyraGame。以及 GameplayTag 驱动的发布/订阅式 UI 注入如何实现"GameFeature 插件的 UI 完全解耦"。
