---
title: "ArcaneRush：从 C++ 基类到蓝图逻辑的 UE5 塔防实战"
date: 2026-08-06 18:00:00
tags:
  - Unreal Engine
  - Blueprint
  - UE5
  - Tower Defense
  - Gameplay Programming
  - DataTable
  - 塔防
categories:
  - Portfolio
description: 基于 UE5.6 的 ArcaneRush，C++ 编写数据层 + 蓝图实现全部游戏逻辑。涵盖多层级继承、DataTable 数据驱动、WorldSubsystem Buff 系统、Spline 寻路、Behavior Tree AI、波次管理及完整局内外 UI。第一个独立 UE 项目，侧重引擎基础功能熟练度与蓝图大规模工程化能力展示。
---

## 项目概览

| 项 | 内容 |
|---|------|
| **引擎** | Unreal Engine 5.6 |
| **类型** | 3D Tower Defense（塔防） |
| **开发周期** | 约 5 个月（2025 年 6 月 — 11 月），21 次提交 |
| **核心标签** | C++, Blueprint, DataTable, Behavior Tree, UMG, Spline |
| **代码规模** | ~500 行 C++，8 个类，蓝图总量 150+ |

这是我的第一个独立 UE 项目。目标是**把引擎核心功能跑通一遍** —— 从 C++ 基类设计到大规模蓝图逻辑编排，从 Behavior Tree AI 到 UMG 局内外完整 UI。核心定位是"会用 UE 做完整游戏"，而非追求某一技术点的极限深度。

<iframe src="//player.bilibili.com/player.html?bvid=BV1uxuJ68Ept" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;height:480px;"></iframe>

📦 高清下载: [EasyLink云链](https://easylink.cc/wuspmt)

---

## 一、架构总览

### 1.1 设计思路：C++ 管数据，蓝图管逻辑

初学时面临一个关键选择：逻辑写 C++ 还是蓝图？最终选择 **C++ 定义基类和数据结构 + 蓝图实现全部游戏逻辑**：

- **C++ 层**：类继承体系 + DataTable 结构体 + 伤害公式 + Buff 子系统 + 工具函数
- **蓝图层**：塔攻击流程、敌人 AI、Hero 技能、HUD 交互、波次调度、存档读取

这样分工的好处是：数据结构和性能敏感的计算在 C++ 中类型安全且可断点调试，而频繁迭代的游戏逻辑在蓝图中可视化和快速调整。

### 1.2 类继承体系

```
ACharacter
  └── ABaseCharacter      ← 所有角色基类（血量/伤害/护甲/Buff 管理）
        ├── ABaseEnemy     ← 敌人（Spline 寻路 + Behavior Tree AI）
        ├── ABaseHero      ← 英雄（技能 + 复活机制）
        └── ABaseSoldier   ← 兵营士兵（复活 + 独立动画）

AActor
  └── ABaseTower          ← 塔（多级升级 + 投射物 + 范围检测）
```

关键设计决策：
- **塔继承 AActor 而非 ACharacter**：塔不需要 CharacterMovementComponent，轻量级 Actor 更合适
- **DataTable 属性嵌入到每个子类的专用结构体**：敌人的 `FEnemyProperty` 里嵌套 `FCharacterBaseProperty`，每个子类只暴露自己需要的额外字段

### 1.3 DataTable 数据驱动

所有角色属性通过 DataTable 配置，不写在蓝图里。以英雄数据为例：

![DataTable 结构](/images/portfolio-td/DataTable.jpg)

塔的属性表则更进一步——升级相关的字段全部用**数组索引**存储：

```cpp
// 塔的属性——每个字段都是按等级索引的数组
USTRUCT(BlueprintType)
struct FTowerProperty : public FTableRowBase {
    TArray<float> AttackRange;       // [600, 650, 720, 800]
    TArray<int32> DamageMin;         // [20, 28, 38, 50]
    TArray<int32> DamageMax;         // [30, 40, 55, 70]
    TArray<int32> Cost;              // [100, 150, 220, 0]  // 0 = 满级
    TArray<UStaticMesh*> StaticMeshes;  // 每级不同外观
    int32 MaxLevel;                  // 动态配置等级上限
};
```

设计意图：新增塔类型只需在 DataTable 加一行，蓝图和代码零改动。

---

## 二、核心系统：塔的攻击流程

这是项目中最复杂、最完整的蓝图链路。完整流程分三层：

```
Tick 层      →  每帧检查攻击条件
探测层       →  Sphere Trace 找到范围内的敌人
攻击执行层   →  随机伤害 + 生成投射物
```

### 2.1 定时探测（Timer + Tick 双线程）

![TowerTick——定时器与攻击条件](/images/portfolio-td/TowerTick.jpg)

```
Event BeginPlay → Set Timer by Function Name:
    Function: "Detect"
    Time: 0.5s, Looping: true

Event Tick:
    IS NOT EMPTY(DetectedEnemies) AND CanAttack?
      True → Cast To AttackTower → Attack → Set CanAttack = false
```

设计考量：
- **0.5s 定时探测**而非每帧 Trace——减少物理查询开销，塔防对实时精度要求不高
- **CanAttack bool 锁**：防止同一帧内多次触发攻击，配合 `AttackCooldownTime` 在攻击完成后重置

### 2.2 Sphere Trace 范围检测

![Detection——多球体追踪](/images/portfolio-td/Detection1.jpg)

```
Detect Event:
    Get Actor Location (self) → Start & End (同一点)
    Get Attack Range → Radius
    Make Array(Object Type: "Enemy")
    Multi Sphere Trace For Objects:
        Ignore Self: true
    Out Hits → SET DetectedEnemies
```

使用 `Multi Sphere Trace For Objects` 而非 `GetAllActorsOfClass`：
- **性能**：物理查询比遍历 Actor 列表快，尤其在敌人数量多时
- **灵活性**：`Object Type` 过滤 + `Ignore Self`，后续可扩展为锥形/扇形

实际用 C++ 封装了命中后的有效性验证：

```cpp
bool ABaseTower::IsEnemyAttackable(ABaseEnemy* Enemy) {
    if (Enemy && !Enemy->IsDead() &&
        (GetAttackRange() >= (Enemy->GetActorLocation() - GetActorLocation()).Length()))
        return true;
    return false;
}
```

### 2.3 攻击执行：随机伤害 + 投射物生成

![Attack——Spawn Bullet](/images/portfolio-td/Attack1.jpg)

```
AttackSingleEnemy:
    Branch(Condition) → True:
        Get World Location(FirePoint)
        Get Closed Enemy(DetectedEnemies) → Enemy
        Get Projectile Speed → Speed
        Random Damage → Damage
        SpawnActor(Bullet Class, Transform, Owner, Target, Speed, Damage)
```

C++ 中的随机伤害与护甲减伤：

```cpp
// 随机伤害（在范围内取随机值）
int32 ABaseCharacter::RandomDamage() {
    return FMath::RandRange(GetDamageMin(), GetDamageMax());
}

// 核心伤害公式
bool ABaseCharacter::LoseHealth(int32 Damage, EDamageType DamageType) {
    if (bIsDead) return false;
    switch (DamageType) {
        case Physical:
            Health -= Damage * (1 - CharacterData.PhysicalArmor * 0.15f);
            break;
        case Magical:
            Health -= Damage * (1 - CharacterData.MagicalArmor);  // 魔抗全效率
            break;
    }
    OnHealthChange.Broadcast();  // 通知 UI 更新血条
    if (Health <= 0) { bIsDead = true; Dead(); }
    return Health <= 0;
}
```

物抗每点减 15% × 护甲值点数的物理伤害，魔抗每点减 100% × 护甲值点数——**物理护甲比魔抗"软"**，这引导玩家对不同敌人选择不同塔类型。

---

## 三、敌人系统：Spline + Behavior Tree

![EnemyBase——攻击动画与状态处理](/images/portfolio-td/EnemyBase.jpg)

敌人通过 Behavior Tree 驱动三件事：

| Task | 实现方式 | 关键点 |
|------|---------|--------|
| **沿路径移动** | Spline + `BTTask_GetNextPoint` | 从 DataTable 读取移动速度 |
| **攻击终点** | `BTTask_EnemyAttack` | 调用 `OnAttackAnimNotify` → Play Montage → 伤害事件 |
| **被击杀** | `OnTakeDamage` → 血量检查 → `Dead()` | `BlueprintImplementableEvent`，蓝图中播死亡动画 + 延迟销毁 |

Spline 路径还有一个有趣的应用——**投射物贝塞尔曲线**。塔生成的子弹不是直线飞行，而是沿 Bezier 曲线移动，增强了视觉表现力。

---

## 四、Buff 子系统：WorldSubsystem + 工厂模式

这是项目中 C++ 架构最完整的一个系统：

```
UMyBuffSubsystem (UWorldSubsystem)
  └── CreateBuff(EBuffType, Rate, Duration) → UBuff*
        ├── USpeedBuff::Attach()     → MaxWalkSpeed *= Rate
        ├── UAttackSpeedBuff::Attach() → AttackCoolDownTime *= Rate
        └── UShieldBuff::Attach()    → PhysicalArmor/MagicalArmor *= Rate
```

核心设计：

```cpp
// 基类——Timer 管理生命周期
void UBuff::Attach(ABaseCharacter* C) {
    Character = C;
    Character->AttachBuff(this);
    GetWorld()->GetTimerManager().SetTimer(Timer, this, &UBuff::Detach, Duration);
}

void UBuff::Detach() {
    Character->RemoveBuff(this);
    GetWorld()->GetTimerManager().ClearTimer(Timer);
}

// 子类只覆写效果数值变更
void USpeedBuff::Attach(ABaseCharacter* C) {
    Super::Attach(C);
    C->GetCharacterMovement()->MaxWalkSpeed *= Rate;
}
void USpeedBuff::Detach() {
    Super::Detach();
    Character->GetCharacterMovement()->MaxWalkSpeed /= Rate;  // 恢复
}
```

选 `UWorldSubsystem` 而非 Component 的原因：Buff 是跨对象的全局能力——Hero 技能给全体敌人上减速、塔的攻击触发护盾——放在 World 级别自然符合其作用域。

---

## 五、UI 与交互

![建造面板按钮点击](/images/portfolio-td/BuildPanel.jpg)

整个 UI 分两层：

| 层 | 主要 Widget | 功能 |
|----|------------|------|
| **局内** | `WBP_GameHUD`, `WBP_BuildPanel`, `WBP_HealthBar_Info`, `WBP_SkillPanel`, `WBP_NextWaveBTN` | 实时血量、防御塔建造、技能释放、波次推进 |
| **局外** | `WBP_StartPanel`, `WBP_MenuPanel`, `WBP_HeroPanel`, `WBP_TowerPanel1`, `WBP_LoadPanel` | 关卡选择、英雄/塔图鉴、存档加载 |

UI 数据绑定流程：

```
GameState(金币变化) → OnHealthChange Delegate → WBP_GameStatePanel(更新文字)
Character(血量变化) → OnHealthChange Delegate → WBP_HealthBar_Info(ProgressBar)
```

C++ 中声明的事件委托：

```cpp
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnHealthChangedDelegate);

UPROPERTY(BlueprintAssignable)
FOnHealthChangedDelegate OnHealthChange;
```

所有 Widget 通过 `Event Construct` → `Get Game Instance` → `Cast` → 获取数据 → `ForEachLoop` 遍历子控件来初始化，构成一个从 GameState → HUD → 子控件的单向数据流。

---

## 六、波次管理系统

![波次切换流程](/images/portfolio-td/WaveSystem.jpg)

波次数据同样走 DataTable：

```cpp
USTRUCT()
struct FEnemyWave : public FTableRowBase {
    TArray<FEnemyNumTime> WaveEnemies;   // 本波敌人列表（名称+数量+间隔+路线）
    int32 WaveCoolDownTime;              // 波间冷却
    FString WaveEvent;                   // 波次事件描述
};

USTRUCT()
struct FGameData : public FTableRowBase {
    TArray<FEnemyWave> Waves;            // 全部波次
    int32 Coins, Health;                 // 起始金币、生命
    TSoftObjectPtr<UWorld> Level;        // 关卡地图
};
```

波次调度流程：`OnGameStart` → 读 DT_GameData → `CreateEnemySpawner` → 按 `CoolDownTime` 间隔生成 → 最后一波 & 敌人清空 → 胜利。

GameMode 每 Tick 检查胜利条件：

```
Event Tick:
    Is Last Wave? AND Generated Enemies IS EMPTY?
        True → Victory → Open WinPanel
```

---

## 七、踩坑记录

### 1. Behavior Tree Task Finish 必须手动标记 Success

**现象**：AI 走到第一个路径点后停止不动。

**原因**：`BTTask_GetNextPoint` 的 `Finish Execute` 节点没有勾选 `Success`，导致 BT 认为 Task 仍在运行中。这是 UE Behavior Tree 最常见的坑——Task 不返回 Success，后续节点永远不会执行。

**Git 记录**：
> `paramove to spline and random spawn point, fix ai malfunction (in task finish, success unchecked)`

### 2. 碰撞预设导致的检测失效

**现象**：`Multi Sphere Trace For Objects` 永远返回空数组。

**原因**：敌人角色的 Collision Preset 中 `Object Type` 不是 "Enemy" 通道。在 Project Settings 创建了自定义 Object Channel 后，忘记在 Enemy 蓝图上设置 Collision Preset。

**教训**：自定义物理通道需要在每个相关 Actor 上确认 Collision 设置，不能只在代码中写过滤逻辑就假设能工作。

### 3. 移动端构建错误

**现象**：`Makefile error`，项目无法编译。

**原因**：引擎版本从 5.5 升级到 5.6 后，`.uproject` 中残留了一个已禁用的插件引用（`"Cargo": {"Enabled": false}`），UBT 在处理时产生兼容性问题。

**解决**：清理 `.uproject` 中无效的插件声明即可。

---

## 八、架构可改进点

| 问题 | 当前做法 | 改进方向 |
|------|---------|---------|
| **等级数组越界** | `TowerData.DamageMin[Level-1]` 无边界检查 | 封装 `GetValueAtLevel()` 加 `check()` 断言 |
| **BaseCharacter 不必要地继承 ACharacter** | 所有角色继承 `ACharacter`，塔防不需要 SkeletalMesh 和物理 | 轻量级角色可改为继承 `APawn` 或自定义 `UObject` |
| **Buff 直接修改 CharacterData** | `AttackSpeedBuff` 直接改了 `CharacterData.AttackCoolDownTime`，如果多个 Buff 叠加可能出错 | 引入属性快照机制，Buff 修改前保存原始值 |
| **缺少网络同步** | 单机项目，未考虑 RPC 和属性复制 | 如需多人模式，需要在 GameMode 加 Server RPC，GameState 加 Replicated 属性 |
| **波次系统耦合在 GameMode 蓝图中** | 波次逻辑、敌人创建、UI 更新全部在一个蓝图里 | 拆分为独立的 `WaveManager` Component |
| **DataTable Init 传原始指针** | `Init(FName, UDataTable*)` 无空指针检查 | 用 `TObjectPtr<UDataTable>` + `ensure()` |

---

> 这是我学习 UE 过程中的第一个完整项目，很多设计决策是在边学边做的过程中形成的。如果对塔防、蓝图架构或 UE 任何方面有讨论兴趣，欢迎交流。
