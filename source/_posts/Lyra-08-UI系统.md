---
title: "【技术探索】Lyra 框架拆解（八·终篇）：UI 系统 —— GameplayTag 驱动的发布/订阅式 UI 注入"
date: 2026-08-10 19:00:00
tags:
  - Lyra
  - Unreal
  - UI
  - CommonUI
  - UIExtension
  - GameplayTag
categories:
  - Portfolio
  - Lyra 框架拆解
description: 拆解 Lyra 的四层 UI 架构——CommonUI 输入路由→CommonGame 多层级 Stack→UIExtension 发布/订阅引擎→LyraGame 专属控件。重点剖析 GameplayTag 驱动的 UI 注入如何让 GameFeature 插件的 HUD 部件完全解耦，以及 CommonUI 为什么比纯 UMG 更适合多人分屏场景。
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
| 七 | [网络同步框架](/2026/08/06/Lyra-07-网络同步) |
| **八** | **UI 系统（本文 · 终篇）** |

---

## 一句话

Lyra 的 UI 系统是一个四层可组合架构——其核心不是一个 `AHUD` 子类，而是一个 GameplayTag 驱动的发布/订阅引擎（`UUIExtensionSubsystem`）。GameFeature 插件通过 GameplayTag 约定向 HUD 发布 Widget，HUD Layout 通过 ExtensionPoint 接收 Widget——双方互不知道对方存在。这套架构也是 CommonUI 在"多人分屏 + 跨平台输入"场景下的一个值得参考的实践。

---

## 一，为什么不直接用 UMG HUD？

在传统 UE 项目中，最自然的 UI 做法是：

```cpp
AHUD::BeginPlay() {
    MainWidget = CreateWidget<UMainHUD>(PlayerController, MainHUDClass);
    MainWidget->AddToViewport();
}
```

这在单人项目中工作得很好。但在 Lyra 的场景下有三个致命短板：

| 问题 | 传统 UMG | Lyra 的需求 |
|------|---------|------------|
| **多人分屏** | `AHUD` 是全局单例，每个 Player 无独立 UI 根 | 4 人分屏 → 4 套独立 UI 树 |
| **跨平台输入** | 手动 `SetInputMode_GameOnly`/`UIOnly`，手柄/键鼠需自己处理 | CommonUI 的 `CommonActivatableWidgetStack` 自动管理输入模式 |
| **GameFeature 热插拔** | HUD 硬引用 Widget 类 → 无法热卸载 | UIExtension 的发布/订阅模式：GameFeature 注册时不引用具体 HUD |

---

## 二，四层分层架构

```
GameFeature 层:   GameFeatureAction_AddWidgets
                  → 向 HUD Layout 注入 Layout + Element Widget
                       ↓
UIExtension 层:   UUIExtensionSubsystem（WorldSubsystem）
                  → GameplayTag 驱动的发布/订阅引擎
                       ↓
CommonGame 层:    UPrimaryGameLayout
                  → 每个 LocalPlayer 独立的根布局 + 多层级 Stack 管理
                       ↓
CommonUI 层:      CommonActivatableWidget + CommonActivatableWidgetStack
                  → 输入路由 + 焦点自动管理 + 跨平台切换
```

### 数据流

```
Experience 加载
  → GameFeature 激活
    → GameFeatureAction_AddWidgets::OnGameFeatureActivating
      → Layout 模式: PushWidgetToLayerStack(UI.Layer.Game, LayoutClass)
      → Widget 模式: UIExtensionSubsystem::RegisterExtensionPoint(Tag, WidgetClass)
        → HUD Layout 内的 ExtensionPointWidget 接收 → 创建 Widget
```

---

## 三，UIExtensionSubsystem：发布/订阅引擎

这是 Lyra UI 系统最核心的创新——它不是"HUD 知道所有 Widget"，而是"HUD 声明插槽，GameFeature 提供内容，GameplayTag 做中介"：

```
发布方（GameFeature）:
  UIExtensionSubsystem->RegisterExtension(
      TAG("HUD.Slot.QuickBar"),     // ← 我要往这个插槽放 Widget
      QuickBarWidgetClass,          // ← 这是我的 Widget 类
      Priority = 0                  // ← 同一插槽多个 Widget 的排序
  );

订阅方（HUD Layout）:
  // UUIExtensionPointWidget 注册到 TAG("HUD.Slot.QuickBar")
  // ExtensionSubsystem 通知有新 Extension 注册
  // → ExtensionPointWidget::RebuildWidget() → CreateWidget(QuickBarWidgetClass)
```

### 关键特性

1. **GameplayTag 层级匹配**：TAG(`HUD.Slot`) 可以接收 TAG(`HUD.Slot.QuickBar`)、TAG(`HUD.Slot.Reticle`) 等所有子 Tag 的 Extension。这提供了"接收全部 HUD 部件"和"接收特定部件"的灵活性
2. **ContextObject 过滤**：Extension 可以携带 Context（如"只有装备了特定武器才显示此 Widget"），ExtensionPoint 在 Rebuild 时检查 Context 是否匹配
3. **Priority 排序**：同一插槽多个 Extension → 按 Priority 排序显示
4. **完全解耦**：发布方（ShooterCore 的 QuickBar）不知道订阅方（HUD Layout）的存在，甚至不知道有没有人订阅

---

## 四，CommonUI 的哲学：UI 是玩家的私有财产

Lyra 选择 CommonUI 而非纯 UMG 的深层原因是 CommonUI 的一个根本假设：

> **每个玩家拥有一棵独立的 UI 树。**

```cpp
// CommonUI 中，每个 LocalPlayer 获得独立的 UPrimaryGameLayout
for (ULocalPlayer* LP : GameInstance->GetLocalPlayers())
    LP->GetPrimaryGameLayout()->PushWidgetToLayerStack(TAG("UI.Layer.Game"), LayoutClass);
```

对比传统 UMG 中 `AHUD` 是全局单例——在 4 人分屏场景下根本无法支持。

### 多层级 Stack + 自动输入模式

```
UPrimaryGameLayout (Root)
  ├─ UCommonActivatableWidgetStack: UI.Layer.Game        ← 游戏 HUD（QuickBar、Reticle、血量）
  ├─ UCommonActivatableWidgetStack: UI.Layer.GameMenu    ← 暂停菜单、背包、地图
  ├─ UCommonActivatableWidgetStack: UI.Layer.Menu        ← 主菜单、设置、角色选择
  └─ UCommonActivatableWidgetStack: UI.Layer.Modal       ← 确认框、错误提示、按键绑定
```

**输入模式自动切换**：当你在 Game 层（HUD 可见）时，输入自动设为 `GameOnly`——鼠标控制视角。当 GameMenu 层有 Widget Push 进入（打开背包），输入自动切换为 `GameAndMenu`——鼠标出现、角色停止响应视角输入。

---

## 五，ULyraActivatableWidget：声明式输入模式

```cpp
ULyraActivatableWidget : UCommonActivatableWidget {
    ELyraWidgetInputMode InputMode;  // ← 声明这个 Widget 要什么输入模式
};

ELyraWidgetInputMode {
    Default,       // 继承父层设置
    GameAndMenu,   // 游戏输入 + UI 输入（鼠标可见，角色可移动）
    Game,          // 纯游戏输入（鼠标隐藏，视角控制）
    Menu,          // 纯 UI 输入（鼠标可见，角色停止响应）
};
```

当这个 Widget 被 Push 到 Stack 上时，System 自动应用其声明的输入模式；被 Pop 时自动恢复之前的模式。


---

## 六，Indicator 系统：3D 世界 → 2D 屏幕投影

Lyra 的离屏指示器系统（离屏目标箭头）是 UI 系统中另一个值得学习的独立子系统：

```
ULyraIndicatorManagerComponent (挂载在 PlayerController)
  ├── IndicatorDescriptor[] — 需要跟踪的目标列表（位置 + 数据）
  └── 通知 SActorCanvas（纯 Slate Panel）
        └── 每帧 ActiveTimer: 3D WorldPos → 2D ScreenPos（ProjectWorldLocationToScreen）
              ├── 在屏幕内 → 显示图标
              └── 在屏幕外 → Clamp + 旋转箭头指向屏幕外方向
```

为什么用纯 Slate 而非 UMG？
- 性能：ActorCanvas 每帧遍历所有指示器做 3D→2D 投影。如果用 UMG Widget，每个指示器一个 Widget 对象 → 大量创建/销毁开销
- `FUserWidgetPool` 池化：即使只在 Slate 层，Widget 实例仍然从池中获取和归还
- `SActorCanvas` 直接处理 Slate 绘制——无 UMG 开销

---

## 七，GameFeatureAction_AddWidgets：两种注入模式

```cpp
UGameFeatureAction_AddWidgets {
    // 模式 1: Layout 模式 — 向 Layer Stack 推入整个 HUD Layout
    FLyraHUDLayoutRequest Layout;
    // → AddWidgets(TAG("UI.Layer.Game"), W_ShooterHUDLayout)

    // 模式 2: Widget 模式 — 向 UIExtensionSubsystem 注册单个 Widget
    FLyraHUDElementEntry Widgets[];
    // → RegisterExtension(TAG("HUD.Slot.QuickBar"), W_QuickBar)
};
```

Layout 模式 = "这个 GameFeature 提供一整套 HUD"（如 ShooterCore 的 `W_ShooterHUDLayout`）。
Widget 模式 = "这个 GameFeature 向现有 HUD 追加一个部件"（如 DLC 武器添加专属弹药计数器）。

**两者可以组合**——ShooterCore ActionSet 同时使用 Layout（推入 HUD Layout）和 Widget（注册 QuickBar/Reticle 等部件）。

---

## 八，全系列回顾

| 篇 | 系统 | 核心思想 |
|----|------|---------|
| 一 | 架构哲学 | 薄 Actor + 厚 Component + GameFeature + Experience |
| 二 | Experience | DataAsset 配方表替代 GameMode 子类 |
| 三 | Character | InitState 状态机替代 BeginPlay 时序 |
| 四 | GAS | 五大封装：AbilitySet / InputTag / ActivationGroup / Global / ExperiencePipe |
| 五 | Equipment | Fragment 组合 + Definition/Instance 分离 + SourceObject 反向引用 |
| 六 | Input | GameplayTag 中介解耦按键绑定与能力激活 |
| 七 | 网络 | 分层解耦 + ReplicationGraph 默认禁用 + FastShared 独立带宽 |
| 八 | UI | GameplayTag 发布/订阅 + CommonUI 多层级 Stack + 异步注入 |

Lyra 在所有这些系统中有同一个设计 DNA：数据驱动注入 + GameplayTag 中介 + 组合优于继承 + 异步不阻塞。理解这个 DNA，比记住任何具体类的 API 都重要。

---

*这是 Lyra 框架拆解系列的最后一篇。如果你对某个系统的实现细节有更深入的问题，欢迎交流。*
