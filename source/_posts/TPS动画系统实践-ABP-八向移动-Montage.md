---
title: "【DEMO展示】TPS动画系统实践：Animation Blueprint + 八向移动 + Montage 的实现步骤"
date: 2026-08-16 12:00:00
tags:
  - Unreal
  - UE5
  - Animation
  - AnimationBlueprint
  - BlendSpace
  - Montage
  - Portfolio
categories:
  - Portfolio
description: 以 UE5.3 TPS 项目为例，拆解 Animation Blueprint 状态机设计、Blend Space 八向移动实现、Animation Montage 的搭建步骤与 C++ / BP 数据链路。
---

## 项目概览

| 项 | 内容 |
|---|------|
| **引擎** | Unreal Engine 5.3 |
| **类型** | 第三人称射击（TPS）动画系统 Demo |
| **核心标签** | Animation Blueprint · Blend Space · Montage · IK Retargeting · Enhanced Input |

一个聚焦 UE5 动画系统的 TPS 角色 Demo。核心产物是一个完整的 Animation Blueprint（ABP_MyCharacter），包含完整的移动状态机、7 个 Blend Space、4 个 Animation Montage，配合 IK Retargeter 将 Mannequin 动画重定向到自定义角色模型。

> 📺 **演示录屏**：
> <iframe src="//player.bilibili.com/player.html?bvid=BV11kuW6PEbv&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" width="100%" height="480" style="border-radius:8px;"></iframe>

---

## 一、Animation Blueprint 总体架构

ABP 是 UE 动画系统的枢纽。本项目的 ABP_MyCharacter 设计分三层：

```
ABP_MyCharacter
├── Event Graph          ← 每帧从 C++ / BP 拿数据，更新动画变量
├── Anim Graph (主输出)
│   ├── Locomotion State Machine  ← 移动状态机
│   │   ├── Idle ──→ Walk ──→ Run
│   │   ├── Idle ──→ Crouch
│   │   ├── Idle ──→ Jump ──→ Fall ──→ Land
│   │   └── TurnInPlace
│   └── Layered Blend Per Bone    ← 上半身 Montage 叠加
│       ├── Base (Locomotion)
│       └── Upper Body Slot (Fire/Reload/Punch)
└── Post Process Anim BP          ← Control Rig Foot IK
```

![Locomotion State Machine](https://cd-cd.top/images/tps-locomotion-state-machine.jpg)

*Locomotion 状态机全景：Idle 作为 Hub，所有移动状态均回到 Idle；TurnInPlace 处理原地转身；IdleToWalk/IdleToRun 等过渡动画保证状态切换平滑。*

### 数据来源：C++ → Anim BP

动画蓝图本身不持有数据，依赖 C++ Character 层每帧计算后传入：

```cpp
// MyCharacter 中，Enhanced Input 每帧驱动 CharacterMovement
// AnimBP 通过 GetVelocity() / GetActorRotation() 等原生接口取值

// BaseGun 中暴露武器动画类型
TEnumAsByte<EWeaponAnimType> GetWeaponType();  // PistolAnim / RifleAnim
```

Anim BP 的 Event Graph 中做方向计算：
- Speed = `Velocity.Size()` — 区分 Idle / Walk / Run
- Direction = `CalculateDirection(Velocity, ActorRotation)` — Blend Space 的横轴
- bIsCrouching = `CharacterMovement.IsCrouching()`
- bIsInAir = `CharacterMovement.IsFalling()`
- WeaponType = 从 `BaseGun::GetWeaponType()` 取值，决定武器动画分支

![AnimGraph 主输出流](https://cd-cd.top/images/tps-animgraph-main.jpg)

*AnimGraph 主输出流：Crouch/WalkRun 两路状态机经 Blend Poses by bool 汇合，通过 DodgeSlot 插槽预留闪避动画叠加位，最终经 LocalMotion 输出给骨骼网格体。*

---

## 二、八向移动的实现步骤

八向移动的核心思路：用 Blend Space 把方向离散化，再用 Animation BP 的 State Machine 按速度分状态。

### Step 1：准备动画资产

为每个移动状态准备 8 个方向的动画序列：

| 方向 | 角度 | Walk 示例 | Run 示例 |
|------|------|-----------|----------|
| Forward | 0° | `anim_walk_forward` | `anim_run_forward` |
| Forward-Right | 45° | `anim_walk_rightforward` | `anim_run_rightforward` |
| Right | 90° | `anim_walk_right` | `anim_run_right` |
| Backward-Right | 135° | `anim_walk_rightbackward` | `anim_run_rightbackward` |
| Backward | 180°/-180° | `anim_walk_backward` | `anim_run_backward` |
| Backward-Left | -135° | `anim_walk_leftbackward` | `anim_run_leftbackward` |
| Left | -90° | `anim_walk_left` | `anim_run_left` |
| Forward-Left | -45° | `anim_walk_leftforward` | `anim_run_leftforward` |

本项目为 8 方向的每个组合都做了独立动画（Walk × 8、Run × 8、Crouch × 8、WalkAim × 8、EquipWalk × 8 等），这是实现高质量八向移动的基础。

### Step 2：创建 Blend Space

为每个移动模式创建 Blend Space（水平轴 = Direction，范围 -180~180）：

```
BS_Walk:  [ -180° | -135° | -90° | -45° | 0° | 45° | 90° | 135° | 180° ]
BS_Run:   [ -180° | -135° | -90° | -45° | 0° | 45° | 90° | 135° | 180° ]
BS_Crouch:[ -180° | -135° | -90° | -45° | 0° | 45° | 90° | 135° | 180° ]
```

一些设置建议：
- Interpolation Time：尽量小（0.1~0.2s），否则方向切换有"飘"感
- 每个动画的权重区域不要过大，否则相邻动画会被错误激活
- 建议开启 `Display Editor Vertices` → `Grid` 模式来可视化每个动画的权重区域

### Step 3：过渡 Blend Space

Idle 和 Move 之间不能直接切换——需要过渡动画：

```
BS_IdleToWalk:   [ Idle → Walk (8 dir)  ]
BS_IdleToRun:    [ Idle → Run (8 dir)   ]
BS_IdleToCrouch: [ Idle → Crouch (8 dir)]
```

这些过渡 Blend Space 在 State Machine 中作为 Transition Rule 的 Blend 资产使用——当状态切换时，过渡阶段播放它们而不是立刻切到目标 Blend Space。

### Step 4：构建 State Machine

```
                      ┌─────────────────────────────┐
                      │         Idle State          │
                      │   (BS_Idle, BS_Turn)        │
                      └──────┬──────────┬───────────┘
                  Speed>150  │          │  Speed>10,<150
                             ▼          ▼
              ┌──────────┐       ┌──────────────┐
              │ Run State│       │  Walk State   │
              │ (BS_Run) │       │ (BS_Walk)     │
              └────┬─────┘       └──────┬───────┘
                   │     Speed<150     │
                   └───────────────────┘ Speed<10
                             │
               Speed<10      ▼
              ┌──────────────────────┐
              │  IdleToRun/WalkStop  │  ← Transition Blend Space
              └──────────────────────┘
```

状态机设计上注意几点：

1. Idle 作为 Hub：所有移动状态最终都回到 Idle，避免状态爆炸
2. Speed 阈值驱动流转：`Speed < 10` → Idle，`10 < Speed < 150` → Walk，`Speed > 150` → Run
3. 过渡使用 Blend Space 而非硬切：Transition 的 `Blend Logic` 设为 `BlendSpace` 类型，引用对应的 IdleToMove Blend Space
4. Crouch 独立子状态机：`bIsCrouching` 触发进入 Crouch 子树，避免和站立状态交叉污染

### Step 5：叠加武器姿态

移动状态只管下半身。上半身的武器姿态通过 Layered Blend Per Bone 叠加：

```
Final Animation Pose
├── Base Pose: Locomotion State Machine (全身)
└── Blend Weight = 1.0, Bone Filter: Spine_01 ~ Head
    └── Blend Poses by Enum (WeaponType)
        ├── PistolAnim → AO_Aim_Pistol + anim_idle_aim
        └── RifleAnim  → AO_Aim_Rifle + anim_idle_aimAR
```

用到的关键节点：
- `Layered Blend Per Bone (Branch Filter = Spine_01)` — 上半身叠加，不影响移动
- `Blend Poses by Enum` — 按 `EWeaponAnimType` 枚举切换手枪/步枪动画集
- 每个武器分支内部再用 `BlendSpace (AimOffset)` 处理 9 方向瞄准

![武器瞄准偏移与上半身分层混合](https://cd-cd.top/images/tps-aim-offset-pistol.jpg)

*武器瞄准偏移系统：AO_Aim_Pistol 接收 Yaw/Pitch 输入对基础持枪动画做 AimOffset 旋转；通过 Layered Blend Per Bone（Branch Filter = Spine_01）将瞄准层叠加到 LocalMotion 下半身上，实现"上半身瞄准 + 下半身移动"的分离。*

### 八向移动中遇到过的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 方向切换有"吸附感" | Blend Space Interpolation 过大 | 设为 0.1~0.15 |
| 后退时动画"反转" | Root Motion 与方向不匹配 | 检查动画的 Root Motion Rotation |
| 武器动画覆盖全身 | Layered Blend Bone Filter 设错 | 确认只 Mask 上半身骨骼链 |
| 停步瞬间脚滑步 | 缺少 Stop 过渡动画 | 添加 WalkStop/RunStop 带左右脚变体 |

---

## 三、Animation Montage 的搭建步骤

Montage 用于"一次性动作"——开火、换弹、闪避、近战。它是插播式的，播完自动退出，不会影响 Locomotion 状态机。

![Montage 插槽集成](https://cd-cd.top/images/tps-ao-unaim-punchslot.jpg)

*AO_UnAim + PunchSlot 链路：基础 LocalMotion 经 AO_UnAim 做非瞄准态偏移修正后，通过 PunchSlot 插槽预留近战动画叠加位——当 PlaySlotAnimationAsDynamicMontage("PunchSlot") 触发时，拳击 Montage 会在此位置插入播放。*

### Step 1：创建 Montage 资产

每个动作一个 Montage，设置 Slot：

| Montage | Slot Name | 用途 | Blend In | Blend Out |
|---------|-----------|------|----------|-----------|
| `AM_Fire` | `UpperBody` | 射击（只影响上半身） | 0.05s | 0.1s |
| `AM_Reload` | `UpperBody` | 换弹 | 0.15s | 0.2s |
| `AM_Dodge` | `FullBody` | 翻滚闪避 | 0.1s | 0.15s |
| `AM_Punch` | `FullBody` | 近战攻击 | 0.1s | 0.15s |

Slot 设计方案：

```
DefaultGroup.UpperBody   ← 上半身动作（Fire / Reload），不打断移动
DefaultGroup.FullBody    ← 全身动作（Dodge / Punch），覆盖移动
```

### Step 2：Anim Graph 中配置 Slot 节点

在 Anim Graph 的输出 Pose 链路中插入 Slot 节点：

```
Locomotion State Machine (Output Pose)
    │
    ▼
Slot "UpperBody" ──→ LayeredBlendPerBone (BoneFilter: Spine_01 ~ Head)
    │                        │
    │  Base Pose (full body) │  Blend Weight = Montage 激活时 → 1.0
    │                        │
    ▼                        ▼
Slot "FullBody" ──→ BlendWeights = 1.0 (覆盖全身)
    │
    ▼
Output Pose
```

注意：`UpperBody` Slot 在 Layered Blend Per Bone 之后、输出之前接入——这样 Montage 播上半身动画时，下半身继续播 Locomotion Pose。而 `FullBody` Slot 直接覆盖整个输出链。

### Step 3：在 Montage 中组织 Section

以 `AM_Fire` 为例：

```
Section: "FireStart"  →  Section: "FireLoop"  →  Section: "FireEnd"
    (举枪 0.1s)            (射击循环)              (收枪)
```

- 连射武器：Loop Section，按下鼠标时循环"FireLoop"，松开时跳"FireEnd"
- 单发武器：只播放 "FireStart" → "FireEnd"，不循环

### Step 4：C++ 侧触发 Montage

```cpp
// MyCharacter::Fire() — 简化版
void AMyCharacter::Fire()
{
    if (CurrentGun && !CurrentGun->NeedReload() && !CurrentGun->bIsReloading)
    {
        CurrentGun->GunFire();  // 这会触发 PlayFireAnimation()
    }
}

// BaseGun::PlayFireAnimation() — 枪械自身动画
void ABaseGun::PlayFireAnimation()
{
    USkeletalMeshComponent* SKM = Cast<USkeletalMeshComponent>(
        GetComponentByClass(USkeletalMeshComponent::StaticClass()));
    if (SKM && FireAnimationAsset)
    {
        SKM->PlayAnimation(FireAnimationAsset, false);
    }
}
```

这里有两层动画：
1. 角色 Montage（`AM_Fire`）— 在 Character 的 Animation BP 中播放，控制角色身体姿态
2. 枪械动画（`FireAnimationAsset`）— 在 Gun 的 SkeletalMeshComponent 上播放，控制枪械自身的套筒/弹匣运动

两者通过 Anim BP 中的 Notify 或者 BP 端逻辑做同步。

### Montage 中遇到过的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Montage 播了但看不见 | Slot 节点没在 Anim Graph 中配置 | 检查 Slot 节点连接顺序 |
| 动作"卡"在最后一帧 | Montage 没有正确结束 | 设置 `Blend Out Time` > 0 |
| 上半身动作影响了腿 | Slot 在 FullBody 层而非 UpperBody | 确认 Slot 名称匹配 |
| 连发时 Montage 重新开始 | 重复 `PlayMontage` 未检查已播放 | 用 `Montage_IsPlaying()` 判断 |

---

## 四、整体数据流回顾

```
Enhanced Input          C++ Character            Animation BP
─────────────          ──────────────           ─────────────
IA_MoveForward  ──→  AddMovementInput  ──→  Velocity
IA_MoveRight                                          │
IA_Run          ──→  MaxWalkSpeed=600          Speed ──→ State Machine
IA_Crouch       ──→  Crouch()             bIsCrouching    │
IA_Aim          ──→  (BP event)          bIsAiming        │
IA_Fire         ──→  AMyCharacter::Fire()                  │
                         │                                 ▼
                    ABaseGun::GunFire()         Blend Space (Direction)
                         │                           │
                    PlayFireAnimation()        Locomotion Pose
                    ICRRecoilInterface               │
                         │                           ▼
                    RecoilComponent          Slot "UpperBody"
                    SpreadRecoilComponent    └── AM_Fire (Montage)
                                                    │
                                                    ▼
                                            Layered Blend Per Bone
                                                    │
                                                    ▼
                                              Output Pose
```

---

## 五、可改进点

| 问题 | 改进方向 |
|------|----------|
| 所有移动动画都是手动导入的序列帧 | 用 Motion Matching（UE 5.4+）替代手配 Blend Space，减少动画数量 + 提升表现 |
| Montage 和 C++ 之间靠 `bIsReloading` 等 bool 变量同步 | 改用 Gameplay Tags 做动作状态标记，更解耦 |
| 枪械动画和角色 Montage 分开播放，同步靠 BP 端 Tick | 用 Sync Group 或 Notify State 做精确帧同步 |
| Control Rig Foot IK 只用在后处理 | 可以进一步用 Control Rig 做瞄准时的脊柱补偿（Spine Look At） |

---

> 如果你也在用 UE5 搭建角色动画系统，欢迎交流。
