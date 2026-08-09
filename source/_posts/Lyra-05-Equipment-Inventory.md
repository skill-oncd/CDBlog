---
title: "【技术探索】Lyra 框架拆解（五）：Equipment & Inventory —— Fragment 模式与三段式装备架构"
date: 2026-08-06 18:00:00
tags:
  - Lyra
  - Unreal
  - Equipment
  - Inventory
  - GAS
  - Fragment
  - Data-Driven
categories:
  - Portfolio
  - Lyra 框架拆解
description: 拆解 Lyra 的三段式装备/物品架构——Inventory（数据容器）、QuickBar（策略桥接）、Equipment（能力授予）——以及 Definition/Instance 分离、Fragment 组合模式、SourceObject 反向引用链的优雅设计。
---

## 系列导航

| 篇 | 主题 |
|----|------|
| 一 | [架构哲学总览](/2026/08/06/Lyra-01-架构哲学总览) |
| 二 | [Experience 系统](/2026/08/06/Lyra-02-Experience系统) |
| 三 | [Character 组件体系](/2026/08/06/Lyra-03-Character组件体系) |
| 四 | [GAS 集成层](/2026/08/06/Lyra-04-GAS集成层) |
| **五** | **Equipment & Inventory（本文）** |
| 六 | [Input 系统](/2026/08/06/Lyra-06-Input系统) |
| 七 | [网络同步框架](/2026/08/06/Lyra-07-网络同步) |
| 八 | [UI 系统](/2026/08/06/Lyra-08-UI系统) |

---

## 一句话

Lyra 的 Equipment/Inventory 系统用三层分离架构实现了"武器切换 = AbilitySet 的 GiveTo + TakeFrom"——Inventory 管"你拥有什么"，Equipment 管"你正装备什么"，QuickBar 做两者之间的策略桥接。而 Fragment 模式让物品定义像积木一样可组合，避免了"武器类膨胀到 5000 行"的问题。

---

## 一，三层架构全景

```
Inventory（数据容器层）—— "你拥有什么"
  ULyraInventoryManagerComponent (挂载在 PlayerState)
  ├── FLyraInventoryList (FFastArraySerializer 网络复制)
  │   └── ULyraInventoryItemInstance[] (运行时实例)
  └── 物品定义: ULyraInventoryItemDefinition（Fragment 数组）

          │  玩家按"3"切武器
          ▼

QuickBar（策略桥接层）—— "你选哪个"
  ULyraQuickBarComponent (挂载在 Controller)
  ├── Slots[] → InventoryItemInstance
  ├── ActiveSlotIndex
  └── EquipItemInSlot(7步流程)

          │  调用 EquipmentManager
          ▼

Equipment（能力授予层）—— "装备怎么生效"
  ULyraEquipmentManagerComponent (挂载在 Pawn)
  ├── ULyraEquipmentDefinition → InstanceType + AbilitySetsToGrant + ActorsToSpawn
  └── ULyraEquipmentInstance → OnEquipped/OnUnequipped 事件
```

---

## 二，Fragment 模式：组合优于继承的极致应用

### 传统方案：武器类的继承爆炸

```
AWeapon
  ├── ARifle     （射击逻辑、弹夹管理、后座力）
  ├── AShotgun   （射击逻辑、弹夹管理、散布）
  ├── APistol    （射击逻辑、弹夹管理、双持）
  ├── AGrenade   （投掷逻辑、引信计时、范围伤害）
  └── AMedkit    （治疗逻辑、使用动画、冷却）
```

每个子类都是"所有功能混在一起"。随着武器类型增加，共享的逻辑（弹夹管理、UI 显示）需要不断抽取基类或复制粘贴。

### Lyra 方案：物品 = Fragment 集合

```cpp
ULyraInventoryItemDefinition : UPrimaryDataAsset {
    // 不定义"武器是什么"，而是列出"武器有哪些碎片"
    TArray<ULyraInventoryItemFragment*> Fragments;  // ← 核心：一个物品 = 一组 Fragment
    
    // 模板方法：按类型查找 Fragment
    template<class T> const T* FindFragmentByClass() const {
        for (auto& Frag : Fragments)
            if (Frag->IsA(T::StaticClass()) return Cast<T>(Frag);  // O(n) 线性查找
        return nullptr;
    }
};
```

每种 Fragment 只负责一个维度的数据：

| Fragment 类型 | 职责 | 示例数据 |
|--------------|------|---------|
| `EquippableFragment` | 定义该物品是否能装备，以及对应的 EquipmentDefinition | EquipmentDef 引用 |
| `DisplayFragment` | 物品名称、图标、描述 | FText + UTexture2D |
| `BulletFragment` | 弹药信息 | GameplayTag Stack 配置 |
| `WeaponPickupFragment` | 世界拾取属性 | 碰撞体大小、拾取音效 |

**一个物品 = 一组 Fragment，每个 Fragment 是一个独立关注点**。新增"附魔系统" = 新增 `EnchantmentFragment`——不需要改任何现有代码。

---

## 三，Definition / Instance 分离

这是 Lyra 中反复出现的模式（Experience ↔ ExperienceManager、PawnData ↔ Pawn、Equipment ↔ Instance）：

| | Definition (DataAsset) | Instance (Runtime Object) |
|---|---|---|
| **性质** | 静态模板，不可变 | 运行时状态，可变 |
| **数量** | 每种装备类型一个 | 每个装备实例一个 |
| **网络** | 不复制（通过 PrimaryAssetId 引用） | 部分复制（StatTags、装备状态） |
| **创建** | 编辑器中配置 | 装备时 NewObject |

```cpp
// 装备流程：Definition → Instance → AbilitySet → ASC
EquipItem(EquipmentDef) {
    auto* Instance = NewObject<ULyraEquipmentInstance>(Pawn);
    // Instance 持有对 Def 的引用
    // Def->AbilitySetsToGrant 通过 Instance 授予
    Def->AbilitySetsToGrant.GiveToAbilitySystem(ASC, &Handles, Instance);  
    // ↑ SourceObject = Instance, 能力可以回溯到装备实例
    SpawnEquipmentActors(Def->ActorsToSpawn);  // 生成世界中的武器 Actor
    Instance->OnEquipped();
}
```

---

## 四，QuickBar：策略桥接层

QuickBar 是 Inventory 和 Equipment 之间的"中间人"——它负责"用户选了哪个物品→通知装备系统"的策略逻辑：

```
SetActiveSlotIndex(NewSlotIndex) {
    // 1. 取出当前槽位的 InventoryItemInstance
    // 2. 找到它的 EquippableFragment
    // 3. 取出 EquipmentDefinition
    // 4. 调用 EquipmentManager::EquipItem(Def)
    
    // 这是一个 Server RPC —— 网络权威在服务器
}
```

**为什么需要 QuickBar 这一层？** 因为 Inventory 不知道 Equipment 的存在（你不背包里所有东西都装备），Equipment 不知道 Inventory 的存在（它只管"当前装备了什么"）。QuickBar 是唯一的"知道两边"的协调层。

---

## 五，SourceObject 反向引用链

当 Ability 需要知道自己来自哪个装备时（例如：射击技能需要获取武器弹药信息），Lyra 不用全局 Manager 查找，而是用 GAS 原生的 `SourceObject` 字段：

```
GameplayAbility（GA_WeaponFire）
  → CurrentAbilitySpec.SourceObject → ULyraEquipmentInstance
    → GetInstigator() → ULyraInventoryItemInstance
      → GetStatTagStackCount(TAG_Ammo) → 当前弹药数
```

这一设计的优势：

| | SourceObject（Lyra） | 全局 Manager 查找（替代方案） |
|---|-----|-----|
| **耦合度** | Ability 只知道 SourceObject 是 UObject，无类型依赖 | Ability 需知道 Manager 的具体类型和获取路径 |
| **多装备场景** | 每个 AbilitySpec 精确绑定到自己的 EquipmentInstance | 需额外的槽位 ID 区分 |
| **网络正确性** | SourceObject 随 AbilitySpec 复制，天然正确 | 需额外复制槽位映射 |

---

## 六，Inventory 的网络复制

Inventory 使用 `FFastArraySerializer` 进行网络复制——这是 UE 中最高效的数组复制方式：

```cpp
FLyraInventoryList : FFastArraySerializer {
    TArray<FLyraInventoryEntry> Entries;
    // FFastArraySerializer 自动处理：
    //   - 增量更新（只复制变化项，不复制整个数组）
    //   - 按 Index 追踪，用 ReplicationID 复用槽位
    //   - PreReplicatedRemove / PostReplicatedAdd 回调保证客户端正确响应
};
```

此外，`ULyraInventoryItemInstance` 通过 `RegisteredSubObject` 注册到 `FLyraInventoryEntry`，实现嵌套对象的自动复制依赖。

---

## 七，装备/卸载完整时序

```
装备：EquipItem(EquipmentDef)
  1. EquipmentList::AddEntry(Def, InstanceType)
  2. NewObject EquipmentInstance(Outer=Pawn)
  3. Def->AbilitySetsToGrant.GiveToAbilitySystem(ASC, &GrantedHandles, Instance)
  4. SpawnEquipmentActors(ActorsToSpawn) — 生成世界 Actor，骨骼挂载
  5. Instance->OnEquipped() — 蓝图事件

卸载：UnequipItem()
  1. Instance->OnUnequipped() — 蓝图事件
  2. EquipmentList::RemoveEntry()
  3. GrantedHandles.TakeFromAbilitySystem(ASC) — ClearAbility(bWasCancelled=true)
  4. DestroyEquipmentActors() — 销毁世界 Actor
```

**关键顺序**：卸载时先 `OnUnequipped`（蓝图有机会做清理），再撤销能力（正在激活的能力收到 Cancel 信号），最后销毁 Actor。

---

## 八，与 PawnData 能力注入的互补

| 能力来源 | 注入路径 | 生命周期 | 典型内容 |
|---------|---------|---------|---------|
| **PawnData.AbilitySets** | Experience → PawnData → PawnExtension → ASC | 随 Pawn 生成/销毁 | 固有：移动、跳跃、血量 |
| **Equipment.AbilitySetsToGrant** | QuickBar → EquipmentManager → ASC | 装备时授予，卸下时撤销 | 装备：射击、换弹、战技 |

两者叠加 = 角色的完整运行时能力集。一个角色永远有"移动 + 跳跃"，但"射击"只在装备武器时有。

---

> **下一篇**：[Input 系统](/2026/08/06/Lyra-06-Input系统) — 拆解 Lyra 的三层抽象输入管道：物理输入 → GameplayTag 路由 → GAS 激活，以及为什么 GameplayTag 中介是模块化框架的"胶水层"。
