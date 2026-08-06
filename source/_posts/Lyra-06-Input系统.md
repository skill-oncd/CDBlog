---
title: "Lyra 框架拆解（六）：Input 系统 —— GameplayTag 作为输入与能力的胶水层"
date: 2026-08-06 18:30:00
tags:
  - Lyra
  - Unreal
  - EnhancedInput
  - GameplayTag
  - GAS
  - Input
categories:
  - Lyra 框架拆解
description: Lyra 在 UE Enhanced Input 之上构建的三层抽象——物理输入→GameplayTag 路由→GAS 激活——拆解 InputConfig DataAsset 如何用 GameplayTag 彻底解耦按键绑定与能力激活，以及 GameFeatureAction 的两阶段输入注入机制。
---

## 系列导航

| 篇 | 主题 |
|----|------|
| 一 | [架构哲学总览](/2026/08/06/Lyra-01-架构哲学总览) |
| 二 | [Experience 系统](/2026/08/06/Lyra-02-Experience系统) |
| 三 | [Character 组件体系](/2026/08/06/Lyra-03-Character组件体系) |
| 四 | [GAS 集成层](/2026/08/06/Lyra-04-GAS集成层) |
| 五 | [Equipment & Inventory](/2026/08/06/Lyra-05-Equipment-Inventory) |
| **六** | **Input 系统（本文）** |
| 七 | [网络同步框架](/2026/08/06/Lyra-07-网络同步) |
| 八 | [UI 系统](/2026/08/06/Lyra-08-UI系统) |

---

## 一句话

Lyra 在 UE Enhanced Input 之上增加了一个**GameplayTag 路由层**——InputConfig 把按键映射为语义 Tag，AbilitySet 把 Tag 关联到具体 GA，运行时 ASC 通过 Tag 匹配完成"按键 → 能力"的路由。这个中间层是 Lyra 模块化架构的"胶水"——没有它，GameFeature 的热加载/卸载在输入层就卡死了。

---

## 一，标准 Enhanced Input 的问题

### 标准做法

```cpp
// 直接绑定：InputAction 指针 → Callback 函数
EnhancedInputComponent->BindAction(IA_Fire, ETriggerEvent::Triggered, 
    this, &AMyCharacter::OnFirePressed);
```

这在单体项目中完全够用。但在 Lyra 的模块化 GameFeature 架构下有致命缺陷：

1. **硬引用 InputAction 资产**：Character C++ 代码引用 `IA_Fire` 指针 → 该 InputAction 必须在所有模式中都存在
2. **一个按键 = 一个能力**：无法支持"同一个按键在不同模式下触发不同能力"
3. **GameFeature 无法卸载**：C++ 层的对象引用阻止了 `.uplugin` 热卸载
4. **按键自定义困难**：玩家想改按键布局，需要修改绑定代码或在 IMC 层处理——但 IMC 和 Ability 之间缺乏中间抽象

### Lyra 的方案：GameplayTag 中介

```
不直接绑定 InputAction → Ability
而是绑定 InputAction → GameplayTag → Ability
```

**InputAction 和 Ability 互不知道对方的存在**。它们唯一的共同点是同一个 GameplayTag 字符串。

---

## 二，三层抽象架构

```
第3层: 能力激活层（GAS）
  LyraAbilitySystemComponent::ProcessAbilityInput
  → InputTag → DynamicSpecSourceTags.HasTagExact(InputTag)
  → TryActivateAbility

第2层: Tag 路由层（Lyra 核心创新）
  ULyraInputConfig:        IA → InputTag 映射（"哪个按键对应哪个语义"）
  ULyraAbilitySet:          Ability → InputTag 关联（"哪个能力响应哪个语义"）
  ULyraInputComponent:     基于 Tag 的批量绑定

第1层: 物理输入层（UE 原生）
  UEnhancedPlayerInput + InputMappingContext + InputAction
  → 处理硬件输入、应用 Modifier、触发 Trigger
```

---

## 三，核心 DataAsset：ULyraInputConfig

这是 Lyra 输入系统的"配置入口"：

```cpp
ULyraInputConfig : UDataAsset {
    // Native 动作（移动、视角、UI导航）—— 不走 GAS
    TArray<FLyraInputAction> NativeInputActions;
    
    // Ability 动作（攻击、跳跃、技能）—— 走 GAS Tag 路由
    TArray<FLyraInputAction> AbilityInputActions;
};

FLyraInputAction {
    UInputAction* InputAction;     // ← 物理按键绑定
    FGameplayTag  InputTag;        // ← 语义标签（"这个按键的含义"）
};
```

### 两类动作的不同处理路径

```
Native 动作（Input_Move, Input_LookMouse）:
  InputAction 触发 → ULyraHeroComponent::Input_Move() 直接处理 → 移动 Component

Ability 动作（Input_AbilityInputTagPressed）:
  InputAction 触发 → HeroComponent::Input_AbilityInputTagPressed(InputTag)
    → ASC::AbilityInputTagPressed(InputTag)
      → 遍历所有 ActivatableAbilities
        → Spec.DynamicSpecSourceTags.HasTagExact(InputTag) ✓
        → InputPressedSpecHandles.AddUnique(Handle) → 暂存，帧末统一激活
```

---

## 四，帧末批量激活：ProcessAbilityInput

Lyra 的能力输入**不在按键回调中直接激活 Ability**，而是暂存到帧末统一处理：

```cpp
void LyraAbilitySystemComponent::ProcessAbilityInput(float DeltaTime, bool bGamePaused) {
    // 对每个暂存的 SpecHandle，按 InputAction 触发状态分类处理：
    
    for (auto& Handle : InputPressedSpecHandles) {
        // InputAction 当前值 > 0？
        if (InputActionValue.GetMagnitude() > 0)
            AbilitySpecInputPressed(Handle);  // → TryActivateAbility（ActivationPolicy = WhileInputActive）
        else
            AbilitySpecInputReleased(Handle);
    }
    
    for (auto& Handle : InputHeldSpecHandles) {
        // 保持按下的能力 → 驱动 WhileInputActive 循环
    }
    
    for (auto& Handle : InputReleasedSpecHandles) {
        // 刚释放 → 触发 OnInputTriggered（ActivationPolicy = OnInputTriggered）
        // 或取消 WhileInputActive 能力
    }
}
```

**为什么帧末统一处理？** 因为同一帧内可能按了多个按键，统一处理可以：
- 批量检查 ActivationGroup 互斥（先检查全局约束，再逐个激活）
- 处理输入取消时序（同一帧内按下 A 又放开 A）
- 性能：一次帧末批处理优于多次回调触发 GAS 查询

---

## 五，InputTag 方案的多重收益

### 一键多能

同一个 `InputTag.Weapon.Fire` Tag 可以关联到多个 AbilitySpec：
- `GA_Weapon_Fire_Rifle`（装备步枪时）
- `GA_Weapon_Fire_Shotgun`（装备霰弹枪时）
- `GA_Hero_Dash`（跑步时，按键含义变为闪避）

ASC 的 `HasTagExact` 匹配会找到**所有**匹配的 AbilitySpec，然后 ActivationGroup 和 TagRequirements 做进一步的"谁应该激活"过滤。

### 条件阻断

```cpp
// 角色力竭时，通过 Tag 临时阻断所有能力输入
ASC->AddLooseGameplayTag(TAG_Gameplay_AbilityInputBlocked);
// ProcessAbilityInput 中检查此 Tag → 所有 Input 被忽略
```

### UI 按键提示

HUD 通过 InputTag 反向查找 InputAction → 获取当前绑定的按键 → 显示"按 R 换弹"提示：

```cpp
// UI 端查询
FGameplayTag InputTag = FGameplayTag::RequestGameplayTag("InputTag.Weapon.Reload");
UInputAction* IA = InputConfig->FindAbilityInputActionForTag(InputTag);
FKey Key = EnhancedInputSubsystem->QueryKeysMappedToAction(IA)[0];
// → 显示 Key.GetDisplayName()
```

---

## 六，GameFeature 的两阶段输入注入

GameFeatureAction 提供两种输入注入方式，解决不同的场景：

| | AddInputBinding | AddInputContextMapping |
|---|---|---|
| **注入内容** | 基于 `ULyraInputConfig` 的能力绑定 | 基于 `UInputMappingContext` 的物理按键映射 |
| **注入时机** | NAME_BindInputsNow 事件（GameplayReady 后） | GameFeature 激活时 + Register 阶段 |
| **目标** | HeroComponent → InputComponent → BindAbilityActions | EnhancedInputSubsystem → AddMappingContext |
| **典型场景** | DLC 角色添加专属技能按键 | 新游戏模式添加不同的按键布局 |

### 为什么需要两个？

`AddInputContextMapping` 只管"按键 → InputAction"，不涉及 GAS。这意味着它可以在 GameFeature 激活时就注入——用户进菜单就能看到新模式的自定义按键布局。

`AddInputBinding` 涉及 InputTag → AbilitySpec 匹配，必须等 ASC 就绪 + 所有 AbilitySet 注入完成——即 `GameplayReady` 之后——才能绑定。

**两阶段分离避免了"IMC 已加载但 ASC 未就绪 → GAS 绑定失败 → 按键无效"的竞态条件。**

---

## 七，输入系统类的完整全景

| 类 | 层 | 职责 |
|----|-----|------|
| `ULyraInputComponent` | Tag 路由 | 扩展 `UEnhancedInputComponent`，提供 `BindAbilityActions(InputConfig)` 批量绑定 |
| `ULyraInputConfig` | Tag 路由 | Const DataAsset：`NativeInputActions` + `AbilityInputActions` |
| `ULyraPlayerInput` | 物理输入 | 扩展 `UEnhancedPlayerInput`，添加 NVIDIA Reflex 延迟标记 |
| `ULyraPlayerMappableKeyProfile` | 物理输入 | 玩家自定义按键映射，预留 Equip/UnEquip 钩子 |
| `ULyraAimSensitivityData` | 物理输入 | PrimaryDataAsset，手柄灵敏度 10 档枚举→浮点映射 |
| `ULyraHeroComponent` | Tag 路由 | 输入初始化的核心协调者：绑定 Native/Ability 动作、广播 `NAME_BindInputsNow` |
| `ULyraAbilitySystemComponent` | 能力激活 | InputTag → Spec 匹配 + `ProcessAbilityInput` 帧末批量激活 |
| `UGameFeatureAction_AddInputBinding` | GameFeature | 注入额外 `ULyraInputConfig` 到 HeroComponent |
| `UGameFeatureAction_AddInputContextMapping` | GameFeature | 注入 `UInputMappingContext` 到 `EnhancedInputSubsystem` |

---

## 八，ARPG 落地要点

对于 TowerChallenge：

1. **不要给每个 Ability 创建专属 InputAction**——通过 InputTag 区分。攻击/格挡/弹反都用同一个按键（右键），但通过 ActivationGroup + 当前状态决定触发哪个 GA
2. **NativeInputActions 保持最小**——只放移动（WASD）、视角（Mouse）、菜单。战斗全部走 AbilityInputActions
3. **插件级输入配置放 GameFeature 内**——每个 GameFeature 定义自己的 IMC 和 InputConfig，不污染项目级配置

---

> **下一篇**：[网络同步框架](/2026/08/06/Lyra-07-网络同步) — 拆解 Lyra 的三层网络架构：Iris 底层序列化、ReplicationGraph 六节点路由、FastShared 路径与 SharedRepMovement 压缩优化。
