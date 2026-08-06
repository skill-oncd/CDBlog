---
title: "UE5 动画系统两种架构：TPS Blend Space 状态机 vs ARPG Montage + GAS 事件驱动"
date: 2026-08-06 14:00:00
tags:
  - Unreal
  - UE5
  - Animation
  - AnimationBlueprint
  - BlendSpace
  - Montage
  - GAS
  - GameplayAbilitySystem
  - Portfolio
categories:
  - Portfolio
description: 对比两个 UE5 项目的动画系统架构——TPS 教程的 Blend Space 八向移动状态机 vs Crunch ARPG 的 GAS AbilityTask + AnimNotify 事件驱动。分析 C++ AnimInstance、Montage 生命周期、伤害判定时机、线程模型的差异与适用场景。
---

## 项目概览

这两篇文章的上下文——一个侧重动画系统本身的学习，一个侧重 GAS 战斗系统的搭建。但放在一起看，它们的动画架构恰好代表了 UE5 的两条主流路线：

| | TPS Tutorial | Crunch |
|---|-------------|--------|
| **引擎版本** | 5.3 | 5.4 |
| **类型** | 第三人称射击 | 近战 ARPG / MOBA |
| **角色资源** | Marketplace 侦探模型 + IK Retarget | Paragon Crunch |
| **动画资产规模** | ~200+ 序列帧 | ~20 序列帧 |
| **Blend Space** | 7 个 | 2 个 |
| **Animation Montage** | 4 个 | 4 个（按技能组织） |
| **C++ AnimInstance** | 无 | 自定义 `UCAnimInstance` |
| **自定义 AnimNotify** | 无 | `AN_SendGameplayEvent` + `AN_SendTargetGroup` |
| **核心驱动** | Enhanced Input → CharacterMovement → AnimBP | GAS AbilityTask → Montage → GameplayEvent |

---

## 一、核心差异：表现丰富度 vs 通信精度

两个项目的设计目标决定了它们走向了不同的动画架构：

- **TPS Tutorial** 的目标是"学会 UE5 动画系统能做什么"——所以它把 Blend Space、状态机、AimOffset、Montage 全部搭了一遍。结果是**动画表现极其丰富**（八向移动 × 多种姿态 × 过渡动画），但 Gameplay 通信层很薄（一个 LineTrace 完事）。

- **Crunch** 的目标是"做出能联网的近战战斗"——所以它的动画资产很少（Paragon 自带），但 **Gameplay 通信层极其精密**：自定义 AnimNotify 在特定帧做 SphereTrace → 打包 TargetData → 发 GameplayEvent → GAS Ability 收到后施加 GE。

一句话概括：**TPS 的动画系统是"展示型"的，Crunch 的动画系统是"功能型"的。**

---

## 二、同一功能，两种实现

### 2.1 方向计算

**TPS — AnimBP Event Graph 内置函数：**

```cpp
// 在蓝图里一行搞定
Direction = CalculateDirection(Velocity, ActorRotation);  // 返回 -180~180
Speed = Velocity.Size();
```

**Crunch — C++ 手动分解前后/左右分量：**

```cpp
void UCAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
    FVector Velocity = OwnerCharacter->GetVelocity();
    FRotator ControlRot = OwnerCharacter->GetBaseAimRotation();

    // 分解为前后和左右两个独立分量
    FwdSpeed   = Velocity.Dot(ControlRot.Vector());
    RightSpeed = -Velocity.Dot(ControlRot.Vector().Cross(FVector::UpVector));

    // 转向速度 + 平滑
    FRotator BodyRotDelta = NormalizedDeltaRotator(BodyRot, BodyPreviousRotation);
    YawSpeed = BodyRotDelta.Yaw / DeltaSeconds;
    SmoothedYawSpeed = FInterpTo(SmoothedYawSpeed, YawSpeed, DeltaSeconds, 1.f);

    // 瞄准偏移
    LookRotOffset = NormalizedDeltaRotator(ControlRot, BodyRot);
}
```

| 维度 | TPS | Crunch |
|------|-----|--------|
| 方向表示 | 单个 Direction 角度 | FwdSpeed + RightSpeed 双分量 |
| 适用场景 | 前进后退对称的速度模型 | 前进后退不对称（后退速度上限更低） |
| 转向处理 | 无 | 计算 YawSpeed + 平滑，驱动转身动画 |
| AimOffset | 在 AnimBP 中用 BlendSpace 处理 | C++ 中预计算 LookRotOffset，传入 BlendSpace |

Crunch 的双分量设计更灵活：前进速度 600、后退速度 200 时，`FwdSpeed` 可以是负数（后退），而 `CalculateDirection` 只输出角度，丢失了"你在后退且速度受限"这个信息。

### 2.2 Animation Montage 生命周期管理

这是两个项目差距最大的设计决策。

**TPS — 隐式管理，分两层：**

```
玩家按下左键
  → C++ MyCharacter::Fire()
    → 如果是第一次射击 → ICRRecoilInterface::StartShooting()
    → BaseGun::GunFire()
      → ShootOnce()            // LineTrace + 伤害
      → PlayFireAnimation()    // 枪械自身 SkeletalMesh 动画
      → CameraShake
  → (同时) AnimBP 蓝图侧监听 "正在开火" 状态 → PlayMontage(AM_Fire)
```

Montage 的播放不是从 C++ 显式触发的，而是 AnimBP 蓝图中通过"检测到正在开火 → 播 AM_Fire"的间接逻辑。FP 枪械的动画和角色 Montage 在两条独立的轨道上，同步靠蓝图端的 Tick 判断。

**Crunch — 显式管理，全在一个类内：**

```cpp
void UGA_Combo::ActivateAbility(...)
{
    // ① Montage 播放由 AbilityTask 管理，不是手动 PlayMontage
    UAbilityTask_PlayMontageAndWait* PlayTask =
        UAbilityTask_PlayMontageAndWait::CreatePlayMontageAndWaitProxy(
            this, NAME_None, ComboMontage);

    // ② 四个退出路径全部绑定 EndAbility —— Montage 结束 = 技能结束
    PlayTask->OnBlendOut.AddDynamic(this, &UGA_Combo::K2_EndAbility);
    PlayTask->OnCancelled.AddDynamic(this, &UGA_Combo::K2_EndAbility);
    PlayTask->OnCompleted.AddDynamic(this, &UGA_Combo::K2_EndAbility);
    PlayTask->OnInterrupted.AddDynamic(this, &UGA_Combo::K2_EndAbility);
    PlayTask->ReadyForActivation();

    // ③ 同时等待 AnimNotify 发来的 GameplayEvent
    UAbilityTask_WaitGameplayEvent* WaitTask =
        UAbilityTask_WaitGameplayEvent::WaitGameplayEvent(
            this, GetComboChangedEventTag(), ...);
    WaitTask->EventReceived.AddDynamic(this, &UGA_Combo::ComboChangedEventReceived);
    WaitTask->ReadyForActivation();

    // ④ 等待玩家下一段按键输入
    SetupWaitComboInputPress();
}

// Combo 段位切换：在动画中通过 AnimNotify 触发
void UGA_Combo::ComboChangedEventReceived(FGameplayEventData Data)
{
    NextComboName = TagNames.Last();      // "Combo1" / "Combo2" / "Combo3"
    SetupWaitComboInputPress();           // 继续等待输入 → HandleInputPressed → TryCommitCombo
}

// 下一段 Combo：用 Montage_SetNextSection 平滑过渡
void UGA_Combo::TryCommitCombo()
{
    UAnimInstance* OwnerAnimInst = GetOwnerAnimInstance();
    OwnerAnimInst->Montage_SetNextSection(
        OwnerAnimInst->Montage_GetCurrentSection(ComboMontage),
        NextComboName, ComboMontage);
}
```

| 维度 | TPS | Crunch |
|------|-----|--------|
| Montage 触发 | AnimBP 蓝图间接触发 | C++ GAS AbilityTask 显式管理 |
| 结束回调 | 依赖 AnimBP 状态机回退 | `OnBlendOut` / `OnCancelled` / `OnInterrupted` 全部绑定 |
| 技能-动画关系 | 松散耦合（各管各） | 强内聚（一个 GA 对象管理一切） |
| Combo 段位切换 | 无 | `Montage_SetNextSection` 无缝衔接 |
| 可调试性 | 需要在 AnimBP 和 C++ 之间跳转 | 全部在一个 `.cpp` 文件中 |

Crunch 方式的核心优势：**一个 Combo 技能的全部逻辑（动画播放 → 等待输入 → AnimNotify 事件 → 段位切换 → 伤害施加 → 技能结束）都在一个 `UGA_Combo` 类里**。审阅或调试时不需要在 AnimBP 蓝图和 C++ 之间来回跳。

### 2.3 伤害判定时机

这是被 Gameplay 类型决定的差异——不是"谁做得更好"，而是"谁更适合自己做的事"。

**TPS — 即时命中（Hitscan）：**

```cpp
void ABaseGun::ShootOnce()
{
    // 按下扳机的同一帧 → LineTrace → 伤害
    FVector StartLoc = CameraManager->GetCameraLocation();
    FVector EndLoc = StartLoc + SpreadRotator.RotateVector(
        CameraManager->GetActorForwardVector()) * 2000;

    bool bHit = GetWorld()->LineTraceSingleByChannel(
        Hit, StartLoc, EndLoc, ECC_Visibility, Params);
    if (bHit)
        MyCharacter->OnGunHit(Hit, this);  // → 蓝图事件
}
```

**Crunch — 动画帧判定（Frame-accurate）：**

```cpp
// AN_SendTargetGroup::Notify() — 挂在 ComboMontage 的"拳头命中帧"
void UAN_SendTargetGroup::Notify(...)
{
    // 在动画特定帧做 SphereTrace
    UKismetSystemLibrary::SphereTraceMultiForObjects(
        MeshComp, StartLoc, EndLoc, SphereSweepRadius, ...);

    // 打包命中结果 → TargetData → GameplayEvent → GAS
    FGameplayAbilityTargetData_SingleTargetHit* TargetHit =
        new FGameplayAbilityTargetData_SingleTargetHit(HitResult);
    Data.TargetData.Add(TargetHit);

    UAbilitySystemBlueprintLibrary::SendGameplayEventToActor(
        MeshComp->GetOwner(), EventTag, Data);
}

// GA_Combo::DoDamage() — 收到事件后施加伤害
void UGA_Combo::DoDamage(FGameplayEventData Data)
{
    for (int i = 0; i < HitResultCount; i++)
    {
        FHitResult Hit = GetHitResultFromTargetData(Data.TargetData, i);
        ApplyGameplayEffectToHitResultActor(Hit, GetDamageEffectForCurrentCombo(), ...);
    }
}
```

| 维度 | TPS | Crunch |
|------|-----|--------|
| 判定时机 | 输入帧（按下扳机那一刻） | 动画帧（拳头到达最远点的那一帧） |
| 判定方式 | LineTrace（射线） | SphereTrace（球体扫描） |
| 适合类型 | 射击——子弹瞬间到达 | 近战——武器轨迹扫过敌人 |
| 伤害可变性 | 固定（枪的伤害值） | 动态（Combo 段位不同 → GE 不同） |
| 判定失败的影响 | 打不中（手感差） | 视觉上打中了但没伤害（手感更差） |

TPS 的 LineTrace 在开枪那一帧执行——开火动画刚起手，子弹已经判定完毕。这对射击游戏来说是正常体验，但如果你把枪口火焰动画和实际 Trace 时间对齐，会发现 Trace 比枪口火花早了 2-3 帧。Crunch 的 AnimNotify 方案把 Trace 精确放在动画帧上——如果是近战游戏，这个精确度直接影响手感。

### 2.4 Gameplay 状态 → 动画状态的数据通道

**TPS** 使用最简单直接的路径：

```
CharacterMovement (bIsCrouching, IsFalling)
    → AnimBP Event Graph 直接读取
    → 驱动 State Machine 转换
```

**Crunch** 使用 GameplayTag 作为中间层：

```cpp
// 初始化时注册 GameplayTag 监听
void UCAnimInstance::NativeInitializeAnimation()
{
    UAbilitySystemComponent* OwnerASC =
        UAbilitySystemBlueprintLibrary::GetAbilitySystemComponent(TryGetPawnOwner());
    if (OwnerASC)
    {
        // Aim 状态通过 GameplayTag 同步
        OwnerASC->RegisterGameplayTagEvent(
            UCAbilitySystemStatics::GetAimStatsTag()
        ).AddUObject(this, &UCAnimInstance::OwnerAimTagChanged);
    }
}

// Tag 变化 → 动画状态
void UCAnimInstance::OwnerAimTagChanged(const FGameplayTag Tag, int32 NewCount)
{
    bIsAiming = NewCount != 0;
}
```

**为什么 Crunch 需要这一层？**

因为 Crunch 的角色状态（瞄准/死亡/眩晕/无敌）不是简单的 `bool`，而是 GAS 的 `FGameplayTag` ——一个角色可以同时持有多个 Tag，且这些 Tag 通过网络自动复制。`bIsAiming` 在客户端和服务端通过同一个机制同步，不需要额外的手动 RPC。

TPS 不需要这层间接——它不做网络同步，`bIsCrouching` 本身就是 CharacterMovement 的同步属性。

---

## 三、线程模型：AnimBP 游戏线程 vs C++ 工作线程

Crunch 的 `CAnimInstance` 明确区分了两个更新函数：

```cpp
// NativeUpdateAnimation — 游戏线程
// 只做数据收集：读 Velocity、算 Speed、算 Yaw
virtual void NativeUpdateAnimation(float DeltaSeconds) override;

// NativeThreadSafeUpdateAnimation — 工作线程
// 在 Anim Graph 更新前执行，可以做混合计算
virtual void NativeThreadSafeUpdateAnimation(float DeltaSeconds) override;
```

TPS 因为完全在 AnimBP 的 Event Graph 中做计算，所有 Update 都在游戏线程的 Blueprint 虚拟机上执行——没有利用 UE5 的动画工作线程。

**什么时候这个区别重要？**

当场景中有 50+ 个角色同时播放动画时，游戏线程的 AnimBP 计算会成为瓶颈。把数据收集放在游戏线程、混合计算放在工作线程，是 UE5 推荐的做法。但对于单机 Demo 来说，这个优化是过早的。

---

## 四、AnimNotify：TPS 没有，Crunch 有

TPS 不需要自定义 AnimNotify——它的 Montage 不向 Gameplay 系统发送信息。开火是 C++ 端主动触发的，换弹也是 C++ 端的 Timer 管理，动画只需要"看起来对"。

Crunch 有两个自定义 AnimNotify，它们是动画系统和 GAS 之间的桥梁：

```cpp
// AN_SendGameplayEvent：在动画特定帧向 ASC 发送 GameplayEvent
// 用于 Combo 段位切换（"Combo1 → Combo2"的切换帧）
UAN_SendGameplayEvent::Notify(...) {
    UAbilitySystemBlueprintLibrary::SendGameplayEventToActor(
        MeshComp->GetOwner(), GameplayEventTag, FGameplayEventData());
}

// AN_SendTargetGroup：在动画特定帧做伤害判定
// 用于 Combo 伤害帧（"拳头命中"那一帧）
UAN_SendTargetGroup::Notify(...) {
    // SphereTrace → 筛选敌对阵营 → 发送 GameplayEvent + GameplayCue
}
```

**设计原则：AnimNotify 不做 Gameplay 逻辑，它只负责"在正确的时刻发消息"。** 收到消息后怎么做——伤害多少、施加什么 GE——全部在 GAS Ability 中决定。这意味着同一个 AnimNotify 可以用在不同的技能里，伤害逻辑由各自的 Ability 处理。

---

## 五、动画资产组织

| 维度 | TPS | Crunch |
|------|-----|--------|
| 移动动画 | 按状态 × 方向 × 姿态分层：Walk × 8 + Run × 8 + Crouch × 8 + Aim × 8 + Equip × 8 | Paragon 自带 Jog/Idle，用 Blend Space 混合 |
| 动作动画 | 按武器类型分：Pistol/AR 各一套 Fire/Reload | 按技能分：Combo / UpperCut / GroundBlast |
| Montage 组织 | 按动作类型分：`AM_Fire` / `AM_Reload` / `AM_Dodge` / `AM_Punch` | 按技能分：`AM_Combo` / `AM_UpperCut` / `AM_GroundBlast` |
| 过渡动画 | 非常全：Idle→Walk (8 dir) / Idle→Run (8 dir) / WalkStop / RunStop (L/R foot) | 依赖 Root Motion |
| IK | Control Rig Foot IK + PostProcess ABP | Control Rig Foot IK (`CR_Crunch_IKFoot`) |

TPS 的动画组织是"从下往上"——从最基本的移动动画开始，一层层叠加（Additive AimOffset → LayeredBlendPerBone 武器姿态 → Montage 插播）。Crunch 是"从上往下"——从技能设计开始（Combo 要有 3 段 → 每段一个 Section → Section 之间用 AnimNotify 桥接），移动动画只是技能的"默认背景层"。

---

## 六、适用场景与选择建议

| 场景 | 推荐方向 | 原因 |
|------|----------|------|
| 学习动画系统本身 | **TPS 方式** | 手搭 Blend Space + 状态机 + Montage 全流程 |
| 射击游戏（Hitscan） | **TPS 方式** | C++ LineTrace，动画只管表现 |
| 近战动作游戏 | **Crunch 方式** | AnimNotify 帧判定 + GAS 管理技能生命周期 |
| 需要联网多人 | **Crunch 方式** | GAS 的 Tag/Attribute 自动复制，AnimNotify 发 Event |
| 团队以蓝图为主 | **TPS 方式** | AnimBP Event Graph 承担大部分工作 |
| 技能需要复杂逻辑 | **Crunch 方式** | 自定义 C++ AnimInstance + AbilityTask 管理一切 |
| 大量 AI 角色同时存在 | **Crunch 方式** | 工作线程 Update + 少量 Blend Space → 性能更好 |

---

## 七、为什么两套方案不矛盾

做实际项目时，你不会只选一种——你会把两者的优势结合起来：

```
项目动画系统 = TPS 的 Blend Space 移动层
              + Crunch 的 GAS + AnimNotify 技能层
              + 自定义 C++ AnimInstance 数据层
```

具体来说：
- **移动系统**用 TPS 的方案：状态机驱动 + 丰富的 Blend Space 过渡
- **战斗技能**用 Crunch 的方案：GAS AbilityTask 管理 Montage 生命周期 + AnimNotify 发 GameplayEvent 做帧判定
- **数据层**统一在 C++ AnimInstance 中计算，GameplayTag 监听 Gameplay 状态

两个项目合在一起，覆盖了 UE5 角色动画的三大支柱：**Blend Space 状态机**（表现力）、**Montage + AnimNotify 事件系统**（功能性）、**C++ AnimInstance + GameplayTag**（数据通信）。

---

> 如果你也在用 UE5 搭建角色动画系统，或者对这两种架构有自己的实践经验，欢迎交流。
