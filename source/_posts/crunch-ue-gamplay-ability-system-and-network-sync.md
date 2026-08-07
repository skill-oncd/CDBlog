---
title: "Crunch：基于 UE5 GAS 的第三人称动作 RPG Demo —— GAS 架构与网络同步"
date: 2026-08-05 12:00:00
tags:
  - Unreal
  - GAS
  - GameplayAbilitySystem
  - NetworkReplication
  - CombatDesign
  - ARPG
  - Portfolio
categories:
  - Portfolio
password: mianshi01
description: 从零搭建 UE5 第三人称动作 RPG Demo。深度复盘 Gameplay Ability System 架构设计、属性集分层、"服务器权威"网络同步模型，以及 Combo / 地面AOE / 浮空连击的技能实现。
---

## 项目概览

| 项 | 内容 |
|---|------|
| **引擎** | Unreal Engine 5.4 |
| **类型** | 第三人称动作 RPG / MOBA 风格 |
| **角色资源** | Epic Paragon（Crunch + Minions） |
| **源码规模** | ~80 个 C++ 文件，覆盖 GAS / AI / UI / Inventory |
| **核心标签** | `GAS` `Network Replication` `Combo System` `RPG Attributes` `Enhanced Input` |

一个从零搭建的 Unreal 动作游戏 Demo。角色是 Paragon 的 Crunch——一个近战拳击手，核心战斗围绕轻击连招、浮空 UpperCut、地面 AOE 轰炸展开。底层完全基于 Gameplay Ability System 搭建，"服务器权威"模型做网络同步。

<iframe src="//player.bilibili.com/player.html?bvid=BV1DfMC6cELg" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="100%" height="480"></iframe>

> 📦 **高清下载**: [EasyLink云链](https://easylink.cc/f409p2)

---

## 一、为什么选 GAS？架构总览

### 1.1 决策背景

做动作游戏 Demo 时，技能系统有几种常见路线：

| 方案 | 优点 | 痛点 |
|------|------|------|
| 手写状态机 | 完全可控，无黑盒 | 技能一多，状态爆炸；Buff/Debuff 要自己写一套 |
| 插件/中间件 | 开箱即用 | 文档质量参差不齐，升级引擎时可能被 break |
| Epic GAS | 为多人游戏设计，内置网络同步，与引擎深度集成 | 学习曲线陡峭，纯 C++ 开发，没有蓝图节点面板 |

选 GAS 的主要考虑：网络同步是"内置"的，不是"后加"的。

做技能系统时，如果你的 Actor 需要 `HasAuthority()` → 做伤害 → 再手动 `Client_RPC` 去播特效，这个模式写三五个技能还行，写到第十个的时候容易出问题——要么忘了权限判断导致作弊，要么忘了客户端回调导致特效不播。

GAS 把"技能激活 → 伤害计算 → 效果应用 → 状态同步"这条链路标准化了。网络同步发生在 GameplayEffect 和 GameplayTag 这两个层级，而这些是 GAS 自动帮你处理的。你不用在每个技能里写 RPC。

### 1.2 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     ACPlayerCharacter                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Enhanced    │  │ Camera +     │  │ Inventory      │  │
│  │ Input       │  │ SpringArm    │  │ Component      │  │
│  └──────┬──────┘  └──────────────┘  └────────────────┘  │
│         │                                                │
│  ┌──────▼──────────────────────────────────────────────┐ │
│  │            UCAbilitySystemComponent (ASC)            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │ Abilities│  │ Basic    │  │ Passive          │  │ │
│  │  │ (技能)   │  │ Abilities│  │ Abilities        │  │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │               AttributeSets                  │   │ │
│  │  │  UCAttributeSet     │  UCHeroAttributeSet    │   │ │
│  │  │  Health / Mana      │  Level / Exp / Intel   │   │ │
│  │  │  AttackDamage / Def │  Strength / Gold       │   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

双层 AttributeSet 设计是这个项目的一个架构决策：

- **`UCAttributeSet`** — 战斗属性：Health、Mana、AttackDamage、Armor、MoveSpeed。所有角色共用，包括 AI 小兵。
- **`UCHeroAttributeSet`** — 英雄属性：Level、Experience、Intelligence、Strength、Gold、UpgradePoint。只挂在玩家角色上。

这样做的原因是：AI 小兵不需要等级和金币系统。如果全部塞进一个 AttributeSet，每个 Minion 身上都会挂着无意义的 `Gold` 和 `Experience` 属性——浪费网络带宽，也污染语义。

---

## 二、GAS 核心实现

### 2.1 自定义 ASC：ServerSideInit / ClientSideInit

这是整个项目比较核心的网络架构模式。看一下 `CCharacter` 的初始化流程：

```cpp
// ── 服务器端：PossessedBy 时调用（AI 角色在服务器被接管）
void ACCharacter::PossessedBy(AController* NewController)
{
    Super::PossessedBy(NewController);
    if (NewController && !NewController->IsPlayerController())
    {
        ServerSideInit();  // AI 角色走这条路
    }
}

// ── 客户端：PostNetInit 时调用（复制体到达客户端后）
void ACCharacter::PostNetInit()
{
    Super::PostNetInit();
    if (GetLocalRole() != ROLE_Authority)
    {
        ClientSideInit();  // 客户端复制体走这条路
    }
}
```

`ServerSideInit()` 做了三件事：

```cpp
void UCAbilitySystemComponent::ServerSideInit()
{
    InitializeBaseAttributes();  // ① 从 DataTable 读取基础属性
    ApplyInitialEffects();       // ② 应用初始 GameplayEffect（满血满蓝）
    GiveInitialAbilities();      // ③ 授予技能
}
```

`ClientSideInit()` 只做一件事：调用 `InitAbilityActorInfo(this, this)`，把 ASC 的 ActorInfo 绑定好，这样客户端才能收到属性复制和 GameplayTag 更新。

> 设计思路：服务器初始化"数据"，客户端只初始化"连接"。服务器拥有权威数据（属性、技能列表、效果），客户端通过 GAS 内置的属性复制机制自动同步，不需要手动 RPC 把属性一个个发过去。

### 2.2 自定义 GameplayAbility 基类

```cpp
UCLASS()
class UCGameplayAbility : public UGameplayAbility
{
    // ── 通用工具方法，所有技能继承
    TArray<FHitResult> GetHitResultsFromSweepLocationTargetData(...);
    void PushTarget(AActor* InTarget, const FVector& InVelocity);
    void PushTargets(const TArray<AActor*>& InTargets, const FVector& PushVelocity);
    void ApplyGameplayEffectToHitResultActor(const FHitResult& Hit, ...);
    ACharacter* GetOwningAvatarCharacter();
};
```

每个技能都需要的操作——从 TargetData 取命中结果、对命中目标施加击退、对命中目标施加 GE——封装到基类里。实际技能只需要关注自己的逻辑。

### 2.3 Combo 连招系统

Combo 是这个项目最复杂的技能逻辑，核心思路是 GameplayEvent 链式驱动：

```
玩家按下攻击键
    → GA_Combo::ActivateAbility()
    → 播放 ComboMontage（动画）
    → AnimNotifier 在特定帧触发 ComboChangedEvent
    → ComboChangedEventReceived() 切换 Combo 段位
    → AnimNotifier 在伤害判定帧触发 ComboTargetEvent
    → DoDamage() 对扇形范围内的敌人施加对应段位的 GE
    → 等待下一次按键输入 → TryCommitCombo() 进入下一段
```

关键代码——按键等待与 Combo 切换：

```cpp
void UGA_Combo::SetupWaitComboInputPress()
{
    // 等待玩家在窗口期内再次按下攻击键
    WaitInputPress(HandleInputPressed, ...);
}

void UGA_Combo::HandleInputPressed(float TimeWaited)
{
    TryCommitCombo();  // 进入下一段 Combo
}

void UGA_Combo::ComboChangedEventReceived(FGameplayEventData Data)
{
    NextComboName = Data.EventMagnitude > 0 
        ? FName(*FString::Printf(TEXT("Combo%d"), (int)Data.EventMagnitude))
        : NAME_None;
    SetupWaitComboInputPress();  // 继续等待下一段输入
}
```

不同 Combo 段位施加不同的 GameplayEffect（伤害系数不同），通过 `DamageEffectMap` 配置：

```cpp
UPROPERTY(EditDefaultsOnly)
TMap<FName, TSubclassOf<UGameplayEffect>> DamageEffectMap;
// "Combo1" → GE_Combo1_Damage
// "Combo2" → GE_Combo2_Damage  (伤害递增)
// "Combo3" → GE_Combo3_Damage  (终结段最大伤害)
```

### 2.4 UpperCut 浮空 + Combo 整合

UpperCut 不仅是一个独立技能，它还能接入 Combo 系统——在 Combo 的任意段位之后接 UpperCut，伤害系数随 Combo 段位变化：

```cpp
UPROPERTY(EditDefaultsOnly, Category="Combo")
TMap<FName, FGenericDamageEffectDef> ComboDamageMap;
// 从 Combo1/Combo2/Combo3 接 UpperCut → 不同的伤害值
```

UpperCut 的浮空效果通过 `LaunchDamageEffect`（一个 GE）实现——给目标施加一个向上的速度：

```cpp
UPROPERTY(EditDefaultsOnly, Category="Launch")
float UpperCutLaunchSpeed = 1000.f;     // 浮空初速度
float UpperCutComboHoldSpeed = 0.f;     // 后续段减速→滞空
```

### 2.5 Ground Blast 地面 AOE

这个技能展示了 GAS 的 TargetActor 机制——先用 GroundPick TargetActor 在地面上选点，确认后再释放：

```cpp
void UGA_GroundBlast::ActivateAbility(...)
{
    // ① 生成 TargetActor，玩家通过光标/摇杆在地面选点
    // ② TargetActor 返回 TargetData（包含选中位置）
    // ③ TargetConfirmed() → 在目标位置播放 GameplayCue（特效）→ 施加伤害
}
```

---

## 三、网络同步模型

### 3.1 核心原则：Server Authoritative

整个项目的网络模型遵循 UE 的标准 Server-Authoritative 模型：

```
┌──────────────────────┐         ┌──────────────────────┐
│        SERVER         │         │        CLIENT         │
│  ┌────────────────┐   │  Replicate  │  ┌────────────────┐  │
│  │ AttributeSet   │───┼───────────→│  │ AttributeSet   │  │
│  │ (权威数据)     │   │  OnRep     │  │ (只读副本)     │  │
│  └────────────────┘   │            │  └────────────────┘  │
│  ┌────────────────┐   │            │  ┌────────────────┐  │
│  │ GameplayTags   │───┼───────────→│  │ GameplayTags   │  │
│  │ (权威状态)     │   │  Replicate │  │ (只读副本)     │  │
│  └────────────────┘   │            │  └────────────────┘  │
│         ▲              │            │         │             │
│         │              │            │         │             │
│  Server RPC ◄──────────┼────────────┼─────────┘             │
│  (技能升级/购买)       │   Client→  │   (按键输入)          │
│                         │   Server   │                       │
└──────────────────────┘         └──────────────────────┘
```

伤害计算、死亡判定、等级提升全部发生在服务器。客户端只负责：
1. 发送输入（通过 Enhanced Input → Ability Input Tag）
2. 接收属性同步（OnRep 回调驱动 UI）
3. 接收 GameplayCue（特效/音效在客户端本地播放）

### 3.2 属性同步：OnRep 驱动 UI

每个复制的属性都声明了 `ReplicatedUsing`：

```cpp
UPROPERTY(ReplicatedUsing = OnRep_Health)
FGameplayAttributeData Health;

UFUNCTION()
void OnRep_Health(const FGameplayAttributeData& OldValue);
```

当客户端收到属性同步时，GAS 自动触发 `OnRep_*`，然后广播 `AttributeValueChangeDelegate`。UI Widget 通过绑定这个 Delegate 自动更新——不需要手动调用任何刷新函数。

```cpp
// UI 绑定：一行代码完成
AbilitySystemComponent->GetGameplayAttributeValueChangeDelegate(
    UCAttributeSet::GetHealthAttribute()
).AddUObject(this, &UStatsGauge::OnHealthChanged);
```

### 3.3 关键权限判断模式

代码中有大量 `HasAuthority()` 判断，确保逻辑只在正确的端执行：

```cpp
// 经验升级——只在服务器计算
void UCAbilitySystemComponent::OnExperienceUpdated(const FOnAttributeChangeData& ChangeData)
{
    if (!GetOwner() || !GetOwner()->HasAuthority())
        return;  // 客户端直接返回，不做升级计算
    // ...曲线查表、升级逻辑...
}

// 死亡触发——只在服务器判定
if (ChangeData.NewValue <= 0)
{
    // 施加 Death GE → 发送 Dead Event → 触发死亡序列
}

// 技能升级——客户端 RPC → 服务器执行 → 客户端回调
void UCAbilitySystemComponent::Server_UpgradeAbilityWithID_Implementation(ECAbilityInputID InputID)
{
    // 服务器：检查升级点数 → 提升技能等级 → MarkAbilitySpecDirty
    Client_AbilitySpecLevelUpdated(AbilitySpec->Handle, AbilitySpec->Level);
}
```

### 3.4 完全不用手动 RPC 的地方

以下流程完全由 GAS 自动处理，不需要写一行 RPC：

| 场景 | GAS 机制 |
|------|----------|
| 技能激活/取消 | Ability Spec 的 `IsActive` 通过 ASC 同步 |
| 属性变化 | AttributeSet 的 `ReplicatedUsing` → OnRep → Delegate |
| 状态变化（死亡/眩晕） | GameplayTag 复制 → `RegisterGameplayTagEvent` 回调 |
| 技能冷却 | `FGameplayAbilitySpec` 内置 Cooldown 计时，自动同步 |
| 伤害数字/特效 | GameplayCue 在客户端本地触发（非 RPC） |

### 3.5 一个反例：GameplayCue 的 RPC 优化

Git 记录里有一条很说明问题的 commit：

> `Optimize the Overflow RPC cues, move it locally, and fix the camera shaking bug`

GameplayCue 在 UE5 中默认是 RPC 方式发送的（`AddGameplayCueToOwner`），在连招频繁触发伤害判定时，多个 Cue 的 RPC 会堆积。这条 commit 把 Cue 改为本地触发——既然 Cue 不涉及 Gameplay 逻辑，完全可以在客户端本地播放，不需要绕服务器一圈。

> 经验：GAS 的默认设置不一定适合你的场景。GameplayCue 默认走 RPC 是为了保证服务器也能"看见" Cue 做后续逻辑，但如果你的 Cue 纯视觉，local 就足够了。

---

## 四、一些踩过的坑

### 4.1 GAS 的"纯 C++"代价

GAS 不像很多 UE 系统那样有蓝图面板。技能激活逻辑、GE 效果计算、属性变化回调——全部在 C++ 里。好处是代码可读、可调试、可 diff；坏处是每改一个伤害公式都要重新编译。

> 平衡策略：逻辑写 C++，配置写蓝图/DataAsset。技能的 `EditDefaultsOnly` 属性（伤害系数、动画蒙太奇、GE 映射表）都暴露给蓝图，策划配置不需要动 C++。

### 4.2 属性同步的"抖动"问题

`PreAttributeChange` 是实现属性 Clamp 的地方（Health = Clamp(NewValue, 0, MaxHealth)），但文档写得很清楚：不要在这里触发 Gameplay 逻辑。因为 `PreAttributeChange` 可能在属性复制的中间状态被调用，此时 MaxHealth 可能还没同步过来。

正确的做法：在 `PostGameplayEffectExecute` 里做逻辑响应（死亡判定、UI 更新）。

### 4.3 死亡状态机与 GAS 的配合

死亡不是"Health ≤ 0 → 播死亡动画"这么简单。这里涉及：

```
Health ≤ 0
  → AddLooseGameplayTag(Dead)       // 标记死亡
  → Apply GE_Death (Infinite)        // 施加无限时长死亡 GE（阻止所有技能）
  → SendGameplayEvent(Dead)          // 广播死亡事件
  → DeathTagUpdated()                // GameplayTag 回调
      → CancelAllAbilities()         // 取消所有进行中的技能
      → PlayDeathAnimation()         // 播放死亡蒙太奇
      → SetRagdollEnabled(true)      // 开始 Ragdoll 物理
```

复活时倒序执行，并且只在服务器移除死亡 GE、重置位置到 StartSpot。

---

## 五、架构可改进点

写给自己看的反思：

| 问题 | 改进方案 |
|------|----------|
| 技能配置分散 — DataTable + DataAsset + 蓝图各自管一部分 | 统一用 DataAsset 做技能定义，一个 DA 描述一个技能的全部参数 |
| 缺少 GameplayAbility 的蓝图层 — 所有 GA 都是 C++ 子类 | 用 `UGameplayAbility` 基类 + `AbilityTask` 可以在蓝图中组装大部分技能 |
| 没有 GAS 的单元测试 | 利用 UE 的 Functional Test + Gauntlet 对技能效果做自动化验证 |
| Inventory 不应该和 GAS 紧耦合 | 把库存系统抽象为独立模块，通过事件系统和 GAS 通信 |
| Combo 系统缺少"取消窗口" | 参考格斗游戏的 Cancel Window 设计，让连招手感和响应更灵敏 |
| GameplayCue 参数传递混乱 — 有些走 EventData，有些走 TargetData | 统一 Cue 参数规范，全部用 `FGameplayCueParameters` 的标准化字段 |

---

## 后续计划

Crunch 是一个验证 GAS 架构思路、踩一遍网络同步的坑的 Demo。下一个项目计划侧重：

- 联网多人战斗 — Crunch 目前只有一个本地玩家，联网的实际体验还没验证
- 更完整的 Combat Loop — 受击反馈、屏幕震动、HitStop、取消窗口
- 技能配置工程化 — 从"写 C++ 子类"迁移到"DataAsset 驱动 + 蓝图组装"

---

> 如果你也在做 UE 动作游戏，或对 GAS 感兴趣——欢迎交流。
